const {axios, getDecimal, logger } = require("../../../utils/utils");

class Market {

    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(apiKey, secretKey, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
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
            let symbol = `${fsym}${tsym}FP`;
            let endpoint = `/v2/instruments?symbol=${symbol}`;
            logger.debug(`aax.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1){
                    let result = res.data.data;
                    let dicData = {};
                    result.forEach(item=>{
                        if(symbol === item.symbol){
                            dicData = {
                                fsym: item.base,
                                tsym: item.quote,
                                minPrice: item.maxPrice,
                                maxPrice: item.minPrice,
                                ename:'aax',
                                tickSize: getDecimal(item.tickSize),
                                minQty:  item.minQuantity,
                                maxQty: item.maxQuantity,
                                stepSize:getDecimal(item.lotSize),
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
                    msg: 'aax.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`aax.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`aax.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.future.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/v2/instruments`;
            logger.debug(`aax.future.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 1){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        if(item.code === 'FP'){
                            let dicData = {
                                symbol: item.symbol,
                                fsym: item.base,
                                tsym: item.quote,
                                tickSize: item.tickSize,
                                baseAssetPrecision: getDecimal(item.lotSize),
                                quoteAssetPrecision: getDecimal(item.tickSize)
                            }
                            lists.push(dicData);
                        }
                    })
                    response.success = true;
                    response.data = {
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
                    msg: 'aax.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`aax.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`aax.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.future.market.getAllSymbolInfo.error: ${error}`);
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
        let symbol = `${fsym}${tsym}FP`;
        let endpoint=`/v2/market/history/candles?symbol=${symbol}&timeFrame=${interval}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint+= `&start=${Math.floor(options[key])}`;
                }else if(key === 'endTime'){
                    endpoint+= `&end=${Math.floor(options[key])}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.future.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: parseInt(item[5]) * 1000,
                            open: item[0],
                            high: item[1],
                            low: item[2],
                            close: item[3],
                            volume:item[4],
                            close_time: '',
                            turnover:''
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'aax',
                        interval: interval,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        message: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'aax.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`aax.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`aax.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.future.market.getKlineHistory.error: ${error}`);
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
        let symbol = `${fsym}${tsym}FP`;
        let endpoint=`/v2/market/orderbook?symbol=${symbol}&level=50`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.future.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success =true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    asks: res.data.asks,
                    bids: res.data.bids,
                    ename:'aax',
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'aax.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`aax.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`aax.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.future.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Market}