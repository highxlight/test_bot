const {axios, getDecimal, logger} = require('../../../utils/utils')

class Market{

    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(apiKey, secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint,timeout: timeout});
    }

    /**
     * getOrderBook
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrderBook(fsym, tsym, options) {
        const endpoint=`/api/v4/futures/usdt/order_book`;
        let symbol = `${fsym}_${tsym}`;
        let queryString = 'contract='+symbol;
        if(options){
            for (let key in options){
                if(key === 'limit' && options[key]){
                    queryString += `&limit=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.market.getOrderBook.url:${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                let asks=[],bids=[];
                res.data.asks.forEach(item=>{
                    asks.push([item.p, item.s])
                })
                res.data.bids.forEach(item=>{
                    bids.push([item.p, item.s])
                })
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    asks: asks,
                    bids: bids,
                    ename:'gateio',
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`gateio.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.market.getOrderBook.error: ${error}`);
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
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint=`/api/v4/futures/usdt/candlesticks`;
        let symbol = `${fsym}_${tsym}`;
        let queryString = `contract=${symbol}&interval=${interval}`;
        if(options){
            if(options){
                for(let key in options){
                    if(key === 'startTime'){
                        queryString += `&from=${options[key]}`;
                    }
                    if(key === 'endTime'){
                        queryString += `&to=${options[key]}`;
                    }
                    if(key === 'limit'){
                        queryString += `&limit=${options[key]}`;
                    }
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.market.getKlineHistory.url:${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData={
                        open_time: parseInt(item.t) * 1000,
                        open: item.o,
                        high: item.h,
                        low: item.l,
                        close:item.c,
                        volume:item.v,
                        close_time: '',
                        turnover: ''
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
                    msg: 'gateio.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`gateio.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.market.getKlineHistory.error: ${error}`);
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
            const endpoint=`/api/v4/futures/usdt/contracts/${symbol}`;
            logger.debug(`gateio.future.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    ename:'gateio',
                    minPrice: null,
                    maxPrice: null,
                    tickSize: getDecimal(res.data.mark_price_round),
                    minQty: res.data.order_size_min,
                    maxQty: res.data.order_size_max,
                    stepSize: getDecimal(res.data.order_price_round),
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.detail;
                }
                response.data = dicData;
                logger.error(`gateio.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`gateio.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.market.getValidSymbol.error: ${error}`);
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
            const endpoint=`/api/v4/futures/usdt/contracts`;
            logger.debug(`gateio.future.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let sym = item.name.split('_');
                    let dicData = {
                       symbol: item.name,
                       fsym: sym[0],
                       tsym: sym[1],
                        tickSize: item.order_price_round,
                       baseAssetPrecision: getDecimal(item.mark_price_round),
                       quoteAssetPrecision: getDecimal(item.order_price_round)
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    ename:'gateio',
                    lists:lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`gateio.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.market.getAllSymbolInfo.error: ${error}`);
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
            const endpoint=`/api/v4/futures/usdt/contracts/${symbol}`;
            logger.debug(`gateio.future.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data ={
                    fsym: fsym,
                    tsym: tsym,
                    ename:'gateio',
                    price: parseFloat(res.data.mark_price),
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`gateio.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.market.getValidSymbol.error: ${error}`);
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
        }
        try{
            let symbol = `${fsym}_${tsym}`;
            let endpoint = `/api/v4/futures/usdt/funding_rate?contract=${symbol}`;
            if(options){
                for (let key in options){
                    if(key === 'limit' && options[key]){
                        endpoint += `&limit=${options[key]}`;
                    }
                }
            }
            logger.debug(`gateio.future.getFundingRate.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData = {
                        fsym: fsym,
                        tsym: tsym,
                        time: parseInt(item.t) * 1000,
                        rate: item.r
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data ={
                    ename:'gateio',
                    lists: lists,
                    rawData: res.data
                };
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.market.getFundingRate:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.market.getFundingRate.err: ${err}`);
            })
            logger.info(`gateio.future.market.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.market.getFundingRate.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Market}