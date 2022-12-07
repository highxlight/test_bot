const ccxt = require('ccxt');
const dayjs = require('dayjs');

class UtilForCcxt {
    static toKlineArr(apiResArr) {
        return apiResArr.map((it) => {
            let [timestamp, open, high, low, close, vol] = it;
            return { timestamp, open, high, low, close, vol };
        });
    }

    static getPrices(klineArr, priceKey = 'close') {
        return klineArr.map((it) => {
            return it[priceKey];
        });
    }

    static formatStr = 'YYYY-MM-DD HH:mm:ss SSS';

    static toOHLCV(it) {
        let [t, o, h, l, c, v] = it;
        return {
            t,
            o,
            h,
            l,
            c,
            v,
            showT: dayjs(t).format(UtilForCcxt.formatStr),
        };
    }

    cacheExchange = {};

    async fetchOHLCVSince(exchange, symbol, timeframe, since) {
        return new Promise(async (resolve, reject) => {
            let klineArr = [];
            while (true) {
                try {
                    const response = await exchange.fetchOHLCV(symbol, timeframe, since);
                    if (response.length) {
                        const firstCandle = exchange.safeValue(response, 0);
                        const lastCandle = exchange.safeValue(response, response.length - 1);
                        const firstTimestamp = exchange.safeInteger(firstCandle, 0);
                        const lastTimestamp = exchange.safeInteger(lastCandle, 0);
                        const firstDatetime = exchange.iso8601(firstTimestamp);
                        const lastDatetime = exchange.iso8601(lastTimestamp);
                        const currentDatetime = exchange.iso8601(exchange.milliseconds());
                        since = lastTimestamp + 1;
                        klineArr = klineArr.concat(response);
                    } else {
                        break;
                    }
                } catch (e) {
                    console.log(e.constructor.name, e.message);
                }
            }
            resolve({ symbol, klineArr: klineArr });
        });
    }

    async extFetchOHLCV(exchangeId, apiType, symbol, timeframe, startTimestamp) {
        let v = this;
        return v.getExchange(exchangeId, apiType).then(async (exchange) => {
            let promise = await v.fetchOHLCVSince(exchange, symbol, timeframe, startTimestamp);
            return promise.klineArr;
        });
    }

    exchanges = {
        // binance:{
        //     "future": new ccxt[exchangeId]({options: {defaultType: "future"}}),
        //     "spot":new ccxt[exchangeId]({options: {defaultType: "spot"}}),
        // }
    };

    async getExchange(exchangeId, apiType) {
        let v = this;
        return new Promise((resolve, reject) => {
            let exchangeMap = (this.exchanges[exchangeId] = this.exchanges[exchangeId] || {});
            let exchange = exchangeMap[apiType];
            if (exchange) {
                resolve(exchange);
            } else {
                if (exchangeId === 'binance') {
                    exchange = exchangeMap[apiType] = new ccxt[exchangeId]({
                        options: { defaultType: apiType },
                    });
                    exchange
                        .loadMarkets()
                        .then((markets) => {
                            resolve(exchange);
                        })
                        .catch((e) => {
                            reject(e);
                        });
                } else {
                    reject(`${exchangeId} ${apiType} not for implemented,please waiting ...`);
                }
            }
        });
    }

    /**
     *
     * 从 binance 交易所获取最近的n条1分钟k线数据
     * @param apiType  spot | future
     * @param symbol  货币对
     * @param num  距离当前的 个数
     * @param timeFrame
     * @returns {Promise<{c: *, t: *, v: *, h: *, l: *, o: *}[]>}
     */
    async getBinanceLastNKline(apiType, symbol, num, timeFrame = '1m') {
        let time = dayjs().add(-1 * num, 'minute');
        let startTimestamps = time.toDate().getTime();
        return this.extFetchOHLCV('binance', apiType, symbol, timeFrame, startTimestamps).then((res) => {
            return res.map((it) => {
                let [t, o, h, l, c, v] = it;
                return { t, o, h, l, c, v };
            });
        });
    }
}

module.exports = UtilForCcxt;
