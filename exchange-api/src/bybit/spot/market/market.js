const {axios, getDecimal, logger} = require("../../../utils/utils");

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
     *
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        };
        try{
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/spot/quote/v1/ticker/24hr?symbol=${symbol}`;
            logger.debug(`bybit.spot.market.get24hTickerStatistic.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bybit',
                        priceChange: '',
                        priceChangePercent: '',
                        openPrice: res.data.result.openPrice,
                        highPrice: res.data.result.highPrice,
                        lowPrice: res.data.result.lowPrice,
                        volume: res.data.result.volume,
                        quoteVolume: res.data.result.quoteVolume,
                        lastPrice: res.data.result.lastPrice,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`bybit.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.market.get24hTickerStatistic.error: ${error}`);
            return response
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
        let endpoint = '/spot/quote/v1/depth?symbol='+symbol;
        if(options){
            for(let key in options){
                if(options[key]){
                    endpoint += `&${key}=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.spot.market.getOrderBook.url:${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bybit',
                        asks: res.data.result.asks,
                        bids: res.data.result.bids,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`bybit.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.market.getOrderBook.error: ${error}`);
            return response
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
        let endpoint = `/spot/quote/v1/kline?symbol=${symbol}&interval=${interval}`;
        if(options){
            for(let key in options){
                if(options[key]){
                    endpoint += `&${key}=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.spot.market.getKlineHistory.url:${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.ret_code === 0){
                    let lists = [];
                    res.data.result.forEach(item=>{
                        let dicData = {
                            open_time: item[0],
                            open: item[1],
                            high:item[2],
                            low: item[3],
                            close:item[4],
                            volume:item[8],
                            close_time: item[6],
                            turnover: item[5]
                        }
                        lists.push(dicData)
                    })
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bybit',
                        interval: interval,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`bybit.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.market.getKlineHistory.error: ${error}`);
            return response
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
        };
        try{
            let symbol = `${fsym}${tsym}`;
            let endpoint =`/spot/v1/symbols`;
            logger.debug(`bybit.spot.market.getValidSymbol.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    let data = {};
                    res.data.result.forEach(item=>{
                        if(item.name === symbol){
                            data = {
                                minPrice: item.minTradeAmount,
                                maxPrice: item.maxTradeAmount,
                                tickSize: getDecimal(item.basePrecision),
                                minQty: item.minTradeQuantity,
                                maxQty: item.maxTradeQuantity,
                                stepSize: getDecimal(item.quotePrecision)
                            }
                        }
                    })
                    data.ename = 'bybit';
                    data.fsym = fsym;
                    data.tsym = tsym;
                    data.rawData = res.data;
                    response.data = data
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`bybit.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.market.getValidSymbol.error: ${error}`);
            return response
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
            let endpoint =`/spot/v1/symbols`;
            logger.debug(`bybit.spot.market.getAllSymbolInfo.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    let lists = [];
                    res.data.result.forEach(item=>{
                        let dicData = {
                            symbol: item.name,
                            fsym: item.baseCurrency,
                            tsym: item.quoteCurrency,
                            tickSize: item.quotePrecision,
                            baseAssetPrecision: getDecimal(item.basePrecision),
                            quoteAssetPrecision: getDecimal(item.quotePrecision)
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'bybit',
                        lists:lists,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`bybit.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.market.getAllSymbolInfo.error: ${error}`);
            return response
        }
    }

    /**
     * getMarketPrice
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getMarketPrice(fsym, tsym){
        let response = {
            success:false,
            data:null
        };
        try{
            let symbol = `${fsym}${tsym}`;
            let endpoint =`/spot/quote/v1/ticker/price?symbol=${symbol}`
            logger.debug(`bybit.spot.market.getMarketPrice.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bybit',
                        price: res.data.result.price,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`bybit.spot.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.market.getMarketPrice.error: ${error}`);
            return response
        }
    }


}
module.exports = {Market}
