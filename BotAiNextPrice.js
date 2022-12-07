let { nextNPrice } = require('./UtilForAi');
const CcxtUtil = require('./UtilForCcxt');
const _ = require('lodash');
const Decimal = require('decimal.js');
const { sleep } = require('./UtilForCommon');
const mdb = require('./datap');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const exchanges = require('./exchange-api/exchange');
const BotMessage = require('./UtilForBotMessage');
const exConfig = require('./exchange-api/config');

/**
 *  the spot for binance ,using ai next price model
 */
class BotAiNextPrice {
    cacheItems = {
        stopLessUuid_orderUuidMap: {}, //{ stopLessOrderUuid:orderUuid}
        takeProfitUuid_orderUuidMap: {}, //{takeProfitUuid:orderUuid}
        orderUuid_orderMap: {}, //{orderUUid:newOrder}
        openOrderUuidArr: [],
    };
    status = '';

    constructor(name, configAll) {
        this.name = name;
        let {
            strategyParams,
            exchange: { type, config },
            botMessageConfig = {
                thread: 'spaces/AAAAmOGj2V8/threads/qxchDIfmpH8',
                url: 'https://chat.googleapis.com/v1/spaces/AAAAmOGj2V8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=OVYfNBHk0s-FuVXbGIkr81XBkxoqqbu3d0h7j7AIO6A%3D',
            },
        } = configAll;
        this.initExchangeApiConfig(type);
        this.exchangeObj = new exchanges[type](config);
        this.strategyParams = strategyParams;
        this.bm = new BotMessage(botMessageConfig);
    }

    initExchangeApiConfig(type) {
        if (type === 'Binance') {
            exConfig.consoleLog = false;
            exConfig.envConfg.binance = true;
        }
    }

    msg(msg) {
        if (this.bm) {
            try {
                this.bm.sendMsg(msg);
            } catch (e) {}
        } else {
            console.log(msg);
        }
    }

    init() {
        //TODO 重新启动时 数据库读取当前运行状态，程序意外中断导致的订单未处理
        //目前由于有5分钟限制
        /**
         * 1 读取所有未完成的订单
         * 2 重置缓存
         */
    }

    /**
     * 运行逻辑：
     *    当【ai预测的平均价格】 低于 【指定时间周期平均价格】 超过 1% 的开单，下单成功后（止盈: 0.1%， 止损: 10%）
     * 运行限制规则 ：
     * 1. 使用现货账号进行交易
     * 2. 一個小時連續最多下10個單子
     * 3. 订单间隔时间最少5分钟
     * 4. 止盈0.1% 止損為10%
     */
    async start() {
        // botsend(`pair-bot8: bot8 was successfully started, ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
        let v = this;
        v.msg(`pair-bot8: bot8 was successfully started, ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
        let {
            fsym, //: "ETH", // 现货货币对
            tsym, //: "USDT", // 现货货币对
            modelPath, //: "./model/ETHUSDT_1m_NEXT_PRICE7_3001_99.813_6.158924398480045_0.001_1648617875787", //ai 模型
            nextAiPriceSize, //: 5, // ai计算多少个未来1m周期的价格
            avgKlineNumberFor1m, //: 240, //平均价格使用多少个1m周期的closePrice进行计算
            // perHourOrderMaxNum,//: 15,  //每小时最大多少个订单
            // minimumOrderInterval,//: 5,   //订单之间的最小间隔时间
            apiType, //:'spot'
            openOrderPer, //:0.99,   //【ai预测的平均价格】 <= 【指定周期closePrice平均价格】 * openOrderPer
            aiModelNeedKlineNum, //: 30,   //当前ai模型需要的k线条数
        } = v.strategyParams;
        v.status = 'running';
        //每3个小时通报一次状态
        setInterval(() => {
            v.msg(`pair-bot8: bot8 is alive `);
        }, 60 * 1000 * 60 * 3);

        let openOrderPerDecimal = new Decimal(openOrderPer);
        let cu = new CcxtUtil();
        while (v.status === 'running') {
            let isCanOpenNextOrder = v.canOpenNextOrder();
            if (isCanOpenNextOrder) {
                let symbol = `${fsym}/${tsym}`.toUpperCase();
                await cu.getBinanceLastNKline(apiType, symbol, avgKlineNumberFor1m).then(async (ohlcvs) => {
                    //获取用于ai预测的用的参数
                    let { lastKlineTimestamp, closePrices } = v.getDateForAi(ohlcvs, aiModelNeedKlineNum);
                    //通过ai进行预测
                    let aiNextPriceRes = await nextNPrice(modelPath, closePrices, nextAiPriceSize, lastKlineTimestamp);
                    //ai预测的未来收盘价格平均值
                    let avgAiNextPrice = _.meanBy(aiNextPriceRes.nextPrices_set, 'next_price');
                    //指定周期平均收盘价格
                    let avgPrice = _.meanBy(ohlcvs, 'c');
                    // 判断是否需要开单 （【ai预测的平均价格】 * openOrderPerDecimal  <= 【指定周期closePrice平均价格】）
                    let percent = new Decimal(avgAiNextPrice).div(new Decimal(avgPrice));
                    let isNeedOpenOrder = percent.lte(openOrderPerDecimal);
                    let percentForShow = percent.toFixed(4);
                    let logMsg = `{ avgPrice:${avgPrice} , avgAiNextPrice${avgAiNextPrice} , percent:${percentForShow} }`;
                    if (isNeedOpenOrder) {
                        v.msg(`pair-bot8: will open new order , ${logMsg}`);
                        await v.openNewOrder();
                    } else {
                        console.log(`wait for next, ${logMsg}`);
                    }
                });
            }
            await sleep(500);
        }
    }

    /**
     *
     * @param ohlcvs  k线数组 [{t,o,h,l,v}]
     * @param lastNum 取最近的多少条
     * @returns {{closePrices: *, timestampForLastClosePrice: (*|string|string|Long|number)}}
     */
    getDateForAi(ohlcvs, lastNum) {
        //获取30条用于ai进行预测
        let pricesForAi = ohlcvs.slice(ohlcvs.length - lastNum, ohlcvs.length);
        let lastKlineTimestamp = pricesForAi[pricesForAi.length - 1].t;
        let closePrices = pricesForAi.map((it) => it.c);
        return { lastKlineTimestamp, closePrices };
    }

    /**
     * 检查是否可开下一个单子
     * @returns {boolean}
     */
    canOpenNextOrder() {
        let lastOrderUuid = '';
        let { orderUuid_orderMap, openOrderUuidArr } = this.cacheItems;
        let { minimumOrderInterval } = this.strategyParams;
        if (openOrderUuidArr.length > 0) {
            lastOrderUuid = openOrderUuidArr[openOrderUuidArr.length - 1];
            return dayjs(orderUuid_orderMap[lastOrderUuid].createTime).add(minimumOrderInterval, 'minute').isBefore(dayjs());
        }
        return true;
    }

    showAccount() {
        ['future', 'spot'].map((apiType) => {
            this.exchangeObj[apiType].account.getAccountBalance().then((res) => {
                let {
                    data: { balances },
                } = res;
                console.log(apiType, '  account');
                console.table(balances.filter((it) => it.available > 0));
            });
        });
    }

    /**
     * 开单
     * @returns {Promise<void>}
     */
    async openNewOrder() {
        let v = this;
        let { fsym, tsym, orderQuantity, stopLessPer, takeProfitPer, apiType } = v.strategyParams;
        let { stopLessUuid_orderUuidMap, takeProfitUuid_orderUuidMap, orderUuid_orderMap, openOrderUuidArr } = v.cacheItems;
        let newOrder = {
            orderUuid: uuidv4(),
            stopLessUuid: uuidv4(),
            takeProfitUuid: uuidv4(),
            createTime: new Date().getTime(),
            updateTime: new Date().getTime(),
        };
        let { orderUuid, stopLessUuid, takeProfitUuid } = newOrder;
        await v.exchangeObj[apiType].order
            .createOrder(fsym, tsym, 'buy', 'market', {
                quantity: orderQuantity,
                newClientOrderId: stopLessUuid,
            })
            .then(async (resp) => {
                if (resp.success) {
                    //缓存订单
                    orderUuid_orderMap[orderUuid] = newOrder.openOrder = resp.data;
                    openOrderUuidArr.push(orderUuid);
                    let { price, executedQty } = newOrder.openOrder;
                    await v.exchangeObj[apiType].order
                        .createOrder(fsym, tsym, 'sell', 'STOP_LOSS', {
                            newClientOrderId: stopLessUuid,
                            quantity: executedQty,
                            stopPrice: new Decimal(price).mul(new Decimal(stopLessPer)).toFixed(6),
                        })
                        .then((res) => {
                            this.recordOrder(res, newOrder, 'stopLessOrder', () => {
                                //缓存止损订单
                                stopLessUuid_orderUuidMap[stopLessUuid] = orderUuid;
                            });
                        });
                    await v.exchangeObj[apiType].order
                        .createOrder(fsym, tsym, 'sell', 'TAKE_PROFIT', {
                            newClientOrderId: takeProfitUuid,
                            quantity: executedQty,
                            stopPrice: new Decimal(price).mul(new Decimal(takeProfitPer)).toFixed(6),
                        })
                        .then((res) => {
                            this.recordOrder(res, newOrder, 'takeProfitOrder', () => {
                                //缓存止盈订单
                                takeProfitUuid_orderUuidMap[takeProfitUuid] = orderUuid;
                            });
                        });
                    v.msg(
                        `pair-bot8:  open new order successful , ${JSON.stringify({
                            orderUuid,
                            stopLessUuid,
                            takeProfitUuid,
                        })} `
                    );
                    //监控止盈止损单子，那个先成交，则取消别一个单子
                    try {
                        await mdb.mongo.create('bot8_run_order', newOrder);
                    } catch (e) {}
                }
            });
    }

    recordOrder(res, orderObj, orderKey, cb) {
        if (res.success) {
            let order = res.data;
            mdb.mongo.create('bot8_exchange_order', order).then((res) => {
                console.log('bot8_exchange_order');
            });
            orderObj[orderKey] = order;
            console.log(orderKey + '   committed');
        } else {
            console.error(orderKey + '  committed error', res.message);
        }
        try {
            cb();
        } catch (e) {}
    }
}

module.exports = BotAiNextPrice;
