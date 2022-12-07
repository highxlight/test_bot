const {axios, getDecimal, logger} = require("../../../utils/utils");

class Market {
    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(apiKey, secretKey, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
    }

    /**
     *
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        };
        let symbol = `${fsym}${tsym}`;
        let endpoint =`/fapi/v1/ticker/24hr?symbol=${symbol}`;
        logger.info(`binance.future.market.get24hTickerStatistic.req: ${symbol}`)
        try{
            logger.debug(`binance.spot.market.get24hTickerStatistic.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                let data = {
                    fsym: fsym,
                    tsym: tsym,
                    ename: 'binance',
                    symbol: res.data.symbol, // 交易对
                    priceChange: res.data.priceChange, // 涨跌价
                    priceChangePercent: res.data.priceChangePercent, //涨跌幅
                    openPrice: res.data.openPrice, //开盘价
                    highPrice: res.data.highPrice, // 最高价
                    lowPrice: res.data.lowPrice, // 最低价
                    volume: res.data.volume, //成交量
                    quoteVolume: res.data.quoteVolume, //成交金额
                    lastPrice: res.data.lastPrice, //最新成交价格
                    rawData: res.data
                }
                response.data = data
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`binance.future.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.info(`binance.future.market.get24hTickerStatistic.error: ${error}`)
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
        let symbol = `${fsym}${tsym}`;
        logger.debug(`binance.future.market.getValidSymbol.req:${symbol}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint=`fapi/v1/exchangeInfo`;
            logger.debug(`binance.future.market.getValidSymbol.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let data = {}
                res.data.symbols.forEach(item=>{
                    if(item.symbol === symbol){
                        item.filters.forEach(filter=>{
                            if(filter.filterType == 'PRICE_FILTER'){
                                data.minPrice = filter.minPrice;
                                data.maxPrice = filter.maxPrice;
                                data.tickSize = getDecimal(filter.tickSize);
                            }else if(filter.filterType === 'LOT_SIZE'){
                                data.minQty = filter.minQty;
                                data.maxQty = filter.maxQty;
                                data.stepSize = getDecimal(filter.stepSize);
                            }
                        })
                    }
                })
                data.fsym = fsym;
                data.tsym = tsym;
                data.ename = 'binance';
                data.rawData = res.data;
                response.success = true;
                response.data= data;
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`binance.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.market.getValidSymbol.error: ${error}`)
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
        };
        try{
            let endpoint = `/fapi/v1/exchangeInfo`;
            logger.debug(`binance.future.market.getAllSymbolInfo.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let lists = []
                res.data.symbols.forEach(item=>{
                    let dicData = {
                        symbol: item.symbol,
                        fsym: item.baseAsset,
                        tsym: item.quoteAsset,
                        tickSize: item.filters[0].tickSize,
                        baseAssetPrecision:item.baseAssetPrecision,
                        quoteAssetPrecision:item.quotePrecision
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    ename: 'binance',
                    lists:lists,
                    rawData: res.data
                };
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`binance.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`);
            return response;
        }catch(error){
            logger.error(`binance.future.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }


    /**
     * getMarketPrice
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getMarketPrice(fsym, tsym){
        logger.debug(`binance.future.market.getMarketPrice.req: fsym:${fsym}, tsym:${tsym}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/fapi/v1/ticker/price?symbol=${symbol}`;
            logger.debug(`binance.future.market.getMarketPrice.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data ={
                    fsym: fsym,
                    tsym: tsym,
                    ename: 'binance',
                    price: res.data.price,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`binance.future.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.market.getMarketPrice.error: ${error}`)
            return response;
        }
    }

    /**
     * getFundingRate
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getFundingRate(fsym, tsym, options){
        let response = {
            success:false,
            data:null
        };
        try{
            let symbol = `${fsym}${tsym}`
            let endpoint = `/fapi/v1/fundingRate?symbol=${symbol}`;
            if(options){
                for(let key in options){
                    if(options[key]){
                        endpoint += `&${key}=${options[key]}`;
                    }
                }
            }
            logger.debug(`binance.future.market.getFundingRate.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data = {
                    lists:[],
                    ename: 'binance',
                    rawData: res.data
                }
                res.data.forEach(item=>{
                    let ditData = {
                        fsym: fsym,
                        tsym: tsym,
                        time: item.fundingTime,
                        rate: item.fundingRate
                    }
                    response.data.lists.push(ditData);
                })
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.getFundingRate:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.getFundingRate.err: ${err}`);
            })
            logger.info(`binance.future.market.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.market.getFundingRate.error: ${error}`)
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
        let queryString=`symbol=${symbol.toUpperCase()}`;
        if(options){
            for(let key in options){
                if(options[key]){
                    queryString += `&${key}=${options[key]}`;
                }
            }
        }
        logger.debug(`binance.future.market.getOrderBook.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/fapi/v1/depth?${queryString}`;
            logger.debug(`binance.future.market.getOrderBook.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data ={
                    fsym: fsym,
                    tsym:tsym,
                    ename: 'binance',
                    asks: res.data.asks,
                    bids: res.data.bids,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`binance.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.market.getOrderBook.error: ${error}`);
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
        let symbol = `${fsym}${tsym}`;
        var queryString='symbol='+symbol.toUpperCase()+'&interval='+interval;
        if(options){
            for(let key in options){
                if(options[key]){
                    queryString += `&${key}=${options[key]}`;
                }
            }
        }
        logger.debug(`binance.future.market.getKlineHistory.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/fapi/v1/klines?${queryString}`;
            logger.debug(`binance.future.market.getKlineHistory.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let klines = [];
                res.data.forEach(item=>{
                    let dicData={
                        open_time: item[0],
                        open: item[1],
                        high: item[2],
                        low: item[3],
                        close: item[4],
                        volume:item[5],
                        close_time: item[6],
                        turnover: item[7]
                    }
                    klines.push(dicData);
                })
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym:tsym,
                    ename: 'binance',
                    interval: interval,
                    lists:klines,
                    rawData: res.data
                };
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`binance.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.market.getKlineHistory.error: ${error}`);
            return response;
        }
    }


}
module.exports = {Market}