const EventEmitter = require('events');
const Decimal = require('decimal.js');
const datap = require('./datap');
const _ = require('lodash');
const TimeHelper = require('./time.js');
const Aimodel = require('./vendor/ml-model-storage/model.js');
const config = require('./config');
const botsend = require('./botsend');
const axios = require('axios');
const { mongo } = require('./datap');
const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:9080',
    timeout: 5000,
});

const getKlineHistory = async (data) => {
    return await axiosInstance.post('/public/market/getKlineHistory', { data: data });
};

const createOrder = async (data) => {
    return await axiosInstance.post('/private/order/createOrder', { data: data });
};
const getSymbol = async (data) => {
    return await axiosInstance.post('/public/market/getValidSymbol', { data: data });
};
const getOrder = async (data) => {
    return await axiosInstance.post('/private/order/orderInfo', { data: data });
};

const getDepth = async (data) => {
    return await axiosInstance.post('/public/market/getOrderBook', { data: data });
};

const cancelOrder = async (data) => {
    return await axiosInstance.post('/private/order/cancelSingle', { data: data });
};

const timeHelper = TimeHelper();

class Bot {
    #status = 'idle';
    #ex = null;
    #settings = {
        fsym: null,
        tsym: null,
    };
    constructor(ex, settings) {
        this.#ex = ex;
        this.#settings = settings;
    }

    #sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async start() {
        this.#status = 'running';
        while (this.#status === 'running') {
            try {
                await this.#onTick();
            } catch (e) {
                console.error(e);
            }
            await this.#sleep(500);
        }
    }

    async eapi(p) {
        return p
            .then((res) => {
                if (res.data.success) {
                    return res.data.data;
                } else {
                    throw new Error(res.data.data.message);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }

    async getOpenOrders() {
        const symbolInfo = await this.eapi(getSymbol(config.bot.symbol));
        const openOrders = await datap.mongo.read('openOrders');
        for (const openOrder of openOrders) {
            if (openOrder.open) {
                const newOrder = await this.eapi(
                    getOrder({
                        userId: openOrder.open?.userId,
                        exchange: openOrder.open?.exchange,
                        marketType: config.bot.symbol.marketType,
                        name: openOrder.open?.ename,
                        fsym: openOrder.open?.fsym,
                        tsym: openOrder.open?.tsym,
                        orderId: openOrder.open?.orderId,
                        clientOrderId: openOrder.open?.clientOrderId,
                    })
                );
                newOrder.userId = openOrder.open?.userId;
                openOrder.open = newOrder;
                await this.#sleep(100);
            }
            if (openOrder.limitClose) {
                const newOrder = await this.eapi(
                    getOrder({
                        userId: openOrder.limitClose?.userId,
                        exchange: openOrder.limitClose?.exchange,
                        marketType: config.bot.symbol?.marketType,
                        name: openOrder.limitClose?.ename,
                        fsym: openOrder.limitClose?.fsym,
                        tsym: openOrder.limitClose?.tsym,
                        orderId: openOrder.limitClose?.orderId,
                        clientOrderId: openOrder.limitClose?.clientOrderId,
                    })
                );
                newOrder.userId = openOrder.open?.userId;
                openOrder.limitClose = newOrder;
                await this.#sleep(100);
            }
            if (openOrder.marketClose) {
                const newOrder = await this.eapi(
                    getOrder({
                        userId: openOrder.marketClose?.userId,
                        exchange: openOrder.marketClose?.exchange,
                        marketType: config.bot.symbol?.marketType,
                        name: openOrder.marketClose?.ename,
                        fsym: openOrder.marketClose?.fsym,
                        tsym: openOrder.marketClose?.tsym,
                        orderId: openOrder.marketClose?.orderId,
                        clientOrderId: openOrder.marketClose?.clientOrderId,
                    })
                );
                newOrder.userId = openOrder.open?.userId;
                openOrder.marketClose = newOrder;
                await this.#sleep(100);
            }
            const openQty = _.get(openOrder, 'open.executedQty');
            const limitExecutedQty = _.get(openOrder, 'limitClose.executedQty', 0);
            const marketExecutedQty = _.get(openOrder, 'marketClose.executedQty', 0);
            openOrder.id = openOrder._id;
            delete openOrder._id;
            delete openOrder.lastModified;
            await datap.mongo.update('openOrders', openOrder);
            if (openQty > 0 && new Decimal(openQty).minus(new Decimal(limitExecutedQty).plus(marketExecutedQty).toFixed(symbolInfo?.stepSize)).lt(symbolInfo?.minQty)) {
                await datap.mongo.delete('openOrders', openOrder._id);
            }
        }
        return datap.mongo.read('openOrders');
    }

    async getNextPriceData(modelPath, trend) {
        timeHelper.timeStart('api: getKlineHistory');
        const klineData = await this.eapi(
            getKlineHistory({
                exchange: config.bot.symbol.exchange,
                marketType: config.bot.symbol.marketType,
                fsym: config.bot.symbol.fsym,
                tsym: config.bot.symbol.tsym,
                interval: '1m',
                limit: 60,
            })
        );
        timeHelper.timeEnd('api: getKlineHistory');

        const dataset = {
            price: klineData?.lists.map((d) => d.close),
            timestamp: klineData?.lists.map((d) => d.close_time),
        };

        return new Promise(async (resolve, reject) => {
            try {
                timeHelper.timeStart('aimodel: predict_need_data');
                await Aimodel.predict_need_data(dataset, modelPath, trend, (d) => {
                    const lastPriceData = d.nextPrices_set.at(config.bot.trend - 1);
                    timeHelper.timeEnd('aimodel: predict_need_data');
                    resolve({
                        price: lastPriceData.next_price,
                        timestamp: lastPriceData.timestamp,
                        nextPricesSet: d.nextPrices_set,
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async buyOrder(askPrice, nextPrice, nextTimestamp, nextPricesSet) {
        const symbolInfo = await this.eapi(getSymbol(config.bot.symbol));
        const fixedAmount = +new Decimal(config.bot.orderAmount).toFixed(symbolInfo?.stepSize);
        const orderVal = new Decimal(fixedAmount).mul(askPrice).toNumber();
        if (fixedAmount >= symbolInfo?.minQty && orderVal >= symbolInfo?.minNotional) {
            const buyParams = {
                ...config.bot.symbol,
                type: 'market',
                side: 'buy',
                quantity: fixedAmount,
                price: 100,
            };
            let openOrderInfo = await this.eapi(createOrder(buyParams));
            while (1) {
                try {
                    openOrderInfo = await this.eapi(
                        getOrder({
                            userId: config.bot.symbol.userId,
                            exchange: openOrderInfo.exchange,
                            marketType: config.bot.symbol.marketType,
                            name: openOrderInfo.ename,
                            fsym: openOrderInfo.fsym,
                            tsym: openOrderInfo.tsym,
                            orderId: openOrderInfo.orderId,
                            clientOrderId: openOrderInfo.clientOrderId,
                        })
                    );
                    if (openOrderInfo.status != 'NEW') {
                        openOrderInfo.userId = config.bot.symbol.userId;
                        break;
                    }
                    await this.#sleep(300);
                } catch (e) {
                    console.log(e);
                    await this.#sleep(500);
                }
            }
            const { insertedId } = await mongo.create('openOrders', {
                open: openOrderInfo,
                askPrice,
                timestamp: nextPricesSet[0].timestamp - 1000 * 60,
                limitClose: null,
                marketClose: null,
                nextPrice,
                nextTimestamp,
                nextPricesSet,
            });
            return {
                insertedId,
            };
        }

        return null;
    }

    async #onTick() {
        const symbolInfo = await this.eapi(getSymbol(this.#settings.symbol));
        timeHelper.time('tick');
        timeHelper.timeStart('api: getOpenOrders');
        const openOrders = await this.getOpenOrders();
        timeHelper.timeEnd('api: getOpenOrders');
        if (!openOrders.length) {
            timeHelper.timeStart('api: getDepth');
            const depth = await this.eapi(
                getDepth({
                    exchange: this.#settings.symbol.exchange,
                    marketType: this.#settings.symbol.marketType,
                    fsym: this.#settings.symbol.fsym,
                    tsym: this.#settings.symbol.tsym,
                })
            );
            timeHelper.timeEnd('api: getDepth');
            await this.#sleep(100);
            const { price: nextPrice, nextPricesSet, timestamp: nextTimestamp } = await this.getNextPriceData(this.#settings.model.path, this.#settings.trend);
            await this.#sleep(100);
            const askPrice = depth?.asks[0];
            if ((nextPrice - askPrice[0]) / askPrice[0] >= this.#settings.gainRatio) {
                timeHelper.timeStart('api: buyOrder');
                await this.buyOrder(askPrice[0], nextPrice, nextTimestamp, nextPricesSet);
                timeHelper.timeEnd('api: buyOrder');
                const waitMS = new Decimal(nextTimestamp).minus(Date.now()).minus(1000).toNumber();
                if (waitMS > 0) {
                    await this.#sleep(waitMS);
                }
            }
        } else {
            const openOrder = openOrders[0];
            if (openOrder.open && openOrder.limitClose == null && openOrder.marketClose == null) {
                // cancel the open order after timeout
                if (Date.now() >= openOrder.nextTimestamp - 1000) {
                    const fixedAmount = +openOrder.open.executedQty.toFixed(symbolInfo?.stepSize);

                    if (fixedAmount >= symbolInfo?.minQty) {
                        const sellParams = {
                            ...this.#settings.symbol,
                            price: openOrder.nextPrice.toFixed(symbolInfo?.tickSize),
                            type: 'limit',
                            side: 'sell',
                            quantity: fixedAmount,
                        };
                        const createdInfo = await this.eapi(createOrder(sellParams)).catch((e) => {
                            console.log(e);
                        });
                        createdInfo.userId = config.bot.symbol.userId;
                        await datap.mongo
                            .update('openOrders', {
                                id: openOrder._id,
                                limitClose: createdInfo,
                            })
                            .catch((e) => {
                                console.log(e);
                            });
                    }
                } else {
                    const waitMS = new Decimal(openOrder.nextTimestamp).minus(Date.now()).minus(1000).toNumber();
                    if (waitMS) {
                        await this.#sleep(waitMS);
                    }
                }
            }
            if (openOrder.open && openOrder.limitClose && openOrder.marketClose == null) {
                if (Date.now() >= openOrder.limitClose.time + this.#settings.openTimeout) {
                    if (openOrder.limitClose.status === 'NEW') {
                        await this.eapi(
                            cancelOrder({
                                userId: openOrder.limitClose?.userId,
                                exchange: openOrder.limitClose?.exchange,
                                marketType: config.bot.symbol.marketType,
                                name: openOrder.limitClose?.ename,
                                fsym: openOrder.limitClose?.fsym,
                                tsym: openOrder.limitClose?.tsym,
                                orderId: openOrder.limitClose?.orderId,
                                clientOrderId: openOrder.limitClose?.clientOrderId,
                            })
                        ).catch((e) => {
                            console.log(e);
                        });
                        await this.#sleep(200);
                        openOrder.limitClose = await this.eapi(getOrder({
                            userId: openOrder.limitClose?.userId,
                            exchange: openOrder.limitClose?.exchange,
                            marketType: config.bot.symbol.marketType,
                            name: openOrder.limitClose?.ename,
                            fsym: openOrder.limitClose?.fsym,
                            tsym: openOrder.limitClose?.tsym,
                            orderId: openOrder.limitClose?.orderId,
                            clientOrderId: openOrder.limitClose?.clientOrderId,
                        }));
                        await this.#sleep(200);
                    }
                    const fixedAmount = +new Decimal(openOrder.limitClose.quantity).minus(openOrder.limitClose.executedQty).toFixed(symbolInfo?.stepSize);
                    if (fixedAmount >= symbolInfo?.minQty) {
                        const sellParams = {
                            ...this.#settings.symbol,
                            type: 'market',
                            side: 'sell',
                            quantity: fixedAmount,
                        };
                        const createdInfo = await this.eapi(createOrder(sellParams)).catch((e) => {
                            console.log(e);
                        });
                        createdInfo.userId = config.bot.symbol.userId;
                        await datap.mongo
                            .update('openOrders', {
                                id: openOrder._id,
                                marketClose: createdInfo,
                            })
                            .catch((e) => {
                                console.log(e);
                            });
                    }
                } else {
                    const waitMS = new Decimal(openOrder.limitClose.time + this.#settings.openTimeout).minus(Date.now()).minus(1000).toNumber();
                    if (waitMS) {
                        await this.#sleep(waitMS);
                    }
                }
            }
        }
    }
}

module.exports = Bot;
