const {axios, getDecimal, logger } = require("../../../utils/utils");

class Market {

    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(apiKey, secretKey, passphrase, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
    }

    /**
     * getValidSymbol
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol = `${fsym}_${tsym}`;
            let endpoint = `/spot/v1/ticker?symbol=${symbol}`;
            logger.debug(`bitmart.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data.tickers;
                    let dicData = null;
                    result.forEach(item=>{
                        dicData = {
                            fsym: fsym,
                            tsym: tsym,
                            ename:'bitmart',
                            priceChange: '',
                            priceChangePercent: '',
                            openPrice: item.open_24h,
                            highPrice: item.high_24h,
                            lowPrice: item.low_24h,
                            volume: parseFloat(item.base_volume_24h).toFixed(8),
                            quoteVolume: parseFloat(item.quote_volume_24h).toFixed(8),
                            lastPrice: item.last_price,
                            rawData: item
                        };
                    })
                    response.success = true;
                    response.data = dicData;
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`bitmart.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.market.get24hTickerStatistic.error: ${error}`);
            return response;
        }
    }

    /**
     * getValidSymbol
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getValidSymbol(fsym, tsym){
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol = `${fsym}_${tsym}`;
            let endpoint = `/spot/v1/symbols/details`;
            logger.debug(`bitmart.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data.symbols;
                    let dicData = {};
                    result.forEach(item=>{
                        if(symbol === item.symbol){
                            dicData = {
                                fsym: item.base_currency,
                                tsym: item.quote_currency,
                                minPrice: null,
                                maxPrice: null,
                                ename:'bitmart',
                                tickSize: getDecimal(item.price_max_precision),
                                minQty:  item.base_min_size,
                                maxQty: item.base_max_size,
                                stepSize:getDecimal(item.quote_increment),
                                rawData: item
                            }
                        }
                    })
                    response.success = true;
                    response.data = dicData;
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`bitmart.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.market.getValidSymbol.error: ${error}`);
            return response;
        }
    }

    /**
     * getAllSymbolInfo
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAllSymbolInfo(){
        let response = {
            success:false,
            data:null
        }
        try{
            let endpoint = `/spot/v1/symbols/details`;
            logger.debug(`bitmart.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data.symbols;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            symbol: item.symbol,
                            fsym: item.base_currency,
                            tsym: item.quote_currency,
                            tickSize: item.min_buy_amount,
                            baseAssetPrecision: getDecimal(item.price_max_precision),
                            quoteAssetPrecision: getDecimal(item.min_buy_amount)
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: 'bitmart',
                        lists: lists,
                        rawData: res.data
                    };
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`bitmart.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }

    /**
     * getKlineHistory
     * @param fsym
     * @param tsym
     * @param interval
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getKlineHistory(fsym, tsym, interval, options){
        let interv = interval;
        if(interval.endsWith('m')){
            interval= parseInt(interval);
        }else if(interval.endsWith('M')) {
            interval= parseInt(interval) * 30 * 24 * 60;
        }else if(interval.endsWith('d')) {
            interval= parseInt(interval) * 24 * 60;
        }else if(interval.endsWith('w')) {
            interval= parseInt(interval) * 7 * 24 * 60;
        }else if(interval.endsWith('h')) {
            interval= parseInt(interval) * 60;
        }else if(interval.endsWith('y')) {
            interval= parseInt(interval) * 365 * 24 * 60;
        }else{
            interval = 1
        }
        let symbol = `${fsym}_${tsym}`;
        let endpoint=`/spot/v1/symbols/kline?symbol=${symbol}&step=${interval}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint+= `&from=${Math.floor(options[key]/ 1000)}`;
                }else if(key === 'endTime'){
                    endpoint+= `&to=${Math.floor(options[key]/ 1000)}`;
                }
            }
        }else{
            let to = Math.floor( Date.now() / 1000);
            let form= to - (interval * 60);
            endpoint+= `&from=${form}&to=${to}`;
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data.klines;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: item.timestamp,
                            open: item.open,
                            high: item.high,
                            low: item.low,
                            close: item.close,
                            volume:item.volume,
                            close_time: '',
                            turnover:parseFloat(item.quote_volume).toFixed(8)
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bitmart',
                        interval: interv,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`bitmart.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.market.getKlineHistory.error: ${error}`);
            return response;
        }
    }

    /**
     * getOrderBook
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrderBook(fsym, tsym, options){
        let symbol = `${fsym}_${tsym}`;
        let endpoint=`/spot/v1/symbols/book?symbol=${symbol}`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data;
                    let asks = [], bids = [];
                    result.sells.forEach(item=>{
                        let lisa = [item.price, item.amount];
                        asks.push(lisa);
                    })
                    result.buys.forEach(item=>{
                        let lisb = [item.price, item.amount];
                        bids.push(lisb);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        asks: asks,
                        bids: bids,
                        ename:'bitmart',
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`bitmart.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Market}