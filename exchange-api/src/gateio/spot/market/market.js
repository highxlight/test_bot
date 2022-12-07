const {axios, logger} = require("../../../utils/utils");

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

    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol= `${fsym}_${tsym}`;
            const endpoint= `/api/v4/spot/tickers?currency_pair=${symbol}`;
            logger.debug(`gateio.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.length > 0){
                    let result = res.data[0];
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'gateio',
                        priceChange: '',
                        priceChangePercent:result.change_percentage,
                        openPrice: '',
                        highPrice: result.high_24h,
                        lowPrice: result.low_24h,
                        volume: result.base_volume,
                        quoteVolume: '',
                        lastPrice: result.last,
                        rawData: result
                    }
                }else{
                    let dicData = {
                        code: 'INVALID_CURRENCY',
                        msg: 'Invalid currency'
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`gateio.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.market.get24hTickerStatistic.error: ${error}`);
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
    async getOrderBook(fsym, tsym, options) {
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint=`/api/v4/spot/order_book`;
        let symbol = `${fsym}_${tsym}`;
        let queryString = 'currency_pair='+symbol;
        if(options){
            for(let key in options){
                if(key.toLowerCase() === 'limit' && options[key]){
                    queryString += `&limit=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.spot.market.getOrderBook.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    ename:'gateio',
                    asks: res.data.asks,
                    bids: res.data.bids,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`gateio.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.market.getOrderBook.error: ${error}`);
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
    async getKlineHistory(fsym, tsym, interval, options) {
        const endpoint=`/api/v4/spot/candlesticks`;
        let symbol = `${fsym}_${tsym}`;
        let queryString = `currency_pair=${symbol}&interval=${interval}`;
        if(options){
            for(let key in options){
                if(key === 'startTime' && options[key]){
                    queryString += `&from=${options[key]}`;
                }else if(key === 'endTime' && options[key]){
                    queryString += `&to=${options[key]}`;
                }else if(key.toLowerCase() === 'limit' && options[key]){
                    queryString += `&limit=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.spot.market.getKlineHistory.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData = {
                        open_time: parseInt(item[0]) * 1000,
                        open: item[5],
                        high:item[3],
                        low: item[4],
                        close:item[2],
                        volume:'',
                        close_time: '',
                        turnover: item[1]
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    ename:'gateio',
                    interval: interval,
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`gateio.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.market.getKlineHistory.error: ${error}`);
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
            const endpoint=`/api/v4/spot/currency_pairs/${symbol}`;
            logger.debug(`gateio.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    minPrice: '',
                    maxPrice: '',
                    ename:'gateio',
                    tickSize: res.data.precision,
                    minQty:  res.data.min_base_amount,
                    maxQty: '',
                    stepSize: res.data.amount_precision,
                    rawData: res.data
            }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`gateio.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.market.getValidSymbol.error: ${error}`);
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
            const endpoint=`/api/v4/spot/currency_pairs`;
            logger.debug(`gateio.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData ={
                        symbol: item.id,
                        fsym: item.base,
                        tsym: item.quote,
                        tickSize: 0,
                        baseAssetPrecision: item.amount_precision,
                        quoteAssetPrecision: item.precision
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    ename:'gateio',
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`gateio.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.market.getAllSymbolInfo.error: ${error}`);
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
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol = `${fsym}_${tsym}`;
            const endpoint=`/api/v4/spot/tickers?currency_pair=${symbol}`;
            logger.debug(`gateio.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data ={
                    fsym: fsym,
                    tsym: tsym,
                    ename:'gateio',
                    price: parseFloat(res.data[0].last),
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`gateio.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.market.getValidSymbol.error: ${error}`);
            return response;
        }
    }


}
module.exports = {Market}