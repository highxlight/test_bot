const {axios, getDecimal, numToString, logger} = require("../../../utils/utils");

class Market{
    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(apiKey,secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
    }

    /**
     * get24hTickerStatistic
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async get24hTickerStatistic(fsym, tsym){
        let symbol = `${fsym}${tsym}`;
        logger.debug(`bitmex.future.market.get24hTickerStatistic.req:${symbol}`)
        const endpoint=`/api/v1/instrument?symbol=${symbol}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.market.get24hTickerStatistic.url:${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                let data = null;
                if(res.data.length>0){
                    data ={
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bitmex',
                        priceChange: null,
                        priceChangePercent: null,
                        openPrice: res.data[0].vwap,
                        highPrice: res.data[0].highPrice,
                        lowPrice: res.data[0].lowPrice,
                        volume: res.data[0].volume24h,
                        quoteVolume:res.data[0].turnover24h,
                        lastPrice: res.data[0].lastPrice,
                        rawData: res.data
                    }
                }
                response.success = true;
                response.data = data;
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`bitmex.future.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.market.get24hTickerStatistic.error: ${error}`);
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
        let symbol = `${fsym}${tsym}`;
        logger.debug(`bitmex.future.market.getOrderBook.req:${symbol}`);
        const endpoint=`/api/v1/orderBook/L2?symbol=${symbol}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.market.getOrderBook.url:${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                let asks = [], bids = [];
                res.data.forEach(item=>{
                    if(item.side.toLowerCase() === 'buy'){
                        asks.push([item.price, item.size]);
                    }else if(item.side.toLowerCase() === 'sell'){
                        bids.push([item.price, item.size]);
                    }
                })
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    asks: asks,
                    bids: bids,
                    ename:'bitmex',
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`bitmex.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

    /**
     * getValidSymbol
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getValidSymbol(fsym,tsym){
        let symbol = `${fsym}${tsym}`;
        logger.debug(`bitmex.future.market.getValidSymbol.req:${symbol}`)
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v1/instrument?symbol=${symbol}`;
            logger.debug(`bitmex.future.market.getValidSymbol.url:${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                let data = null;
                if(res.data.length > 0){
                    let priceIncrement = res.data[0].tickSize;
                    if(priceIncrement.toString().indexOf('e-') != -1){
                        priceIncrement = priceIncrement.toString().split('e-')[1];
                    }
                    data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bitmex',
                        minPrice: null,
                        maxPrice: res.data[0].maxPrice,
                        tickSize: getDecimal(parseFloat(priceIncrement)),
                        minQty: null,
                        maxQty: res.data[0].maxOrderQty,
                        stepSize: 0,
                        rawData: res.data
                    };
                }
                response.data = data;
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`bitmex.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.market.getValidSymbol.error: ${error}`);
            return response;
        }
    }

    /**
     * getAllSymbolInfo
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAllSymbolInfo(){
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v1/instrument/active`;
            logger.debug(`bitmex.future.market.getAllSymbolInfo.url:${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
               let lists = [];
               res.data.forEach(item=>{
                   let priceIncrement = item.tickSize;
                   if(priceIncrement.toString().indexOf('e-') != -1){
                       priceIncrement = priceIncrement.toString().split('e-')[1];
                   }
                   let dicData = {
                       symbol:item.symbol,
                       fsym: item.rootSymbol,
                       tsym: item.quoteCurrency,
                       tickSize: numToString(item.tickSize.toString()),
                       baseAssetPrecision: 0,
                       quoteAssetPrecision:getDecimal(priceIncrement),
                   }
                   lists.push(dicData);
               })
                response.success = true;
                response.data = {
                    ename: 'bitmex',
                    lists: lists,
                    rawData:res.data
                };
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`bitmex.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Market}
