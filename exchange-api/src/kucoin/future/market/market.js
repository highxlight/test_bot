const {axios, getDecimal, numToString, logger} = require("../../../utils/utils");

class Market {
    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(apiKey, secretKey, passphrase, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
    }

    /**
     *
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrderBook(fsym, tsym, options){
        let symbol = `${fsym}${tsym}`;
        let market = tsym === 'USDT' ? `${symbol}M` : symbol;
        const endpoint = `api/v1/level2/depth100?symbol=${market}`;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.future.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        asks: res.data.data.asks,
                        bids: res.data.data.bids,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`kucoin.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.market.getOrderBook.error: ${error}`);
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
        let num = parseInt(interval.substring(0, interval.length-1));
        if(interval.endsWith('m')){
            interval= num;
        }else if(interval.endsWith('M')){
            interval= num * 30 * 24 * 60
        }else if(interval.endsWith('d')){
            interval= num * 24 * 60
        }else if(interval.endsWith('w')){
            interval= num * 7 * 24 * 60
        }else if(interval.endsWith('y')){
            interval= num * 365 * 24 * 60
        }else if(interval.endsWith('h')){
            interval= num * 60
        }else{
            interval= num * 24 * 60
        }
        let symbol = `${fsym}${tsym}`;
        let market = tsym === 'USDT' ? `${symbol}M` : symbol;
        let endpoint = `/api/v1/kline/query?granularity=${interval}&symbol=${market}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint += `&from=${options[key]}`;
                }
                if(key === 'endTime'){
                    endpoint += `&to=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.future.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    let lists = [];
                    res.data.data.reverse();
                    res.data.data.forEach(item=>{
                        let dicData = {
                            open_time: item[0],
                            open: item[1],
                            high:item[2],
                            low: item[3],
                            close:item[4],
                            volume:item[5],
                            close_time: '',
                            turnover: ''
                        }
                        if(options.limit && parseInt(options.limit) > 0){
                            if(lists.length < options.limit){
                                lists.push(dicData);
                            }else{
                                return;
                            }
                        }else {
                            lists.push(dicData)
                        }
                    })
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        interval: interval,
                        lists: lists.reverse(),
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`kucoin.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.order.getKlineHistory.error: ${error}`);
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
            success: false,
            data: null
        }

        try{

            let symbol = `${fsym}${tsym}`;
            let market = tsym === 'USDT' ? `${symbol}M` : symbol;
            let endpoint = `/api/v1/contracts/${market}`;
            logger.debug(`kucoin.future.market.getValidSymbol.url: ${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        minPrice: res.data.data.tickSize,
                        maxPrice: res.data.data.maxPrice,
                        tickSize: getDecimal(res.data.data.tickSize),
                        minQty: res.data.data.lotSize,
                        maxQty: res.data.data.maxOrderQty,
                        stepSize: getDecimal(res.data.data.lotSize),
                        rawData: res.data.data
                }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`kucoin.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.market.getValidSymbol.error: ${error}`);
            return response;
        }
    }

    /**
     * getAllSymbolInfo
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAllSymbolInfo(){
        let response = {
            success: false,
            data: null
        }
        try{
            let endpoint = `/api/v1/contracts/active`;
            logger.debug(`kucoin.future.market.getAllSymbolInfo.url: ${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    let lists = [];
                    res.data.data.forEach(item=>{
                        let lotSize = item.lotSize;
                        let tickSize = item.tickSize;
                        if(lotSize.toString().indexOf('e-') != -1){
                            lotSize = lotSize.toString().split('e-')[1];
                        }
                        if(tickSize.toString().indexOf('e-') != -1){
                            tickSize = tickSize.toString().split('e-')[1];
                        }
                        let dicData = {
                            symbol: item.symbol,
                            fsym: item.baseCurrency,
                            tsym: item.quoteCurrency,
                            tickSize: numToString(item.tickSize),
                            baseAssetPrecision: getDecimal(lotSize) ,
                            quoteAssetPrecision: getDecimal(tickSize),
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'kucoin',
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`kucoin.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }

    /**
     * getMarketPrice
     * @param fsym
     * @param tsym
     * @returns {Promise<*>}
     */
    async getMarketPrice(fsym, tsym){
        let response = {
            success: false,
            data:null
        }
        try{
            let symbol = `${fsym}${tsym}`;
            let market = tsym === 'USDT' ? `${symbol}M` : symbol;
            let endpoint =`/api/v1/ticker?symbol=${market}`;
            logger.debug(`kucoin.future.market.getMarketPrice.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        price: res.data.data.price,
                        rawData: res.data
                }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`kucoin.future.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.getMarketPrice.error: ${error}`);
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
            let symbol = `${fsym}${tsym}`;
            let market = tsym === 'USDT' ? `${symbol}M` : symbol;
            let endpoint =`/api/v1/funding-rate/${market}/current`;
            logger.debug(`kucoin.future.market.getFundingRate.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        ename:'kucoin',
                        lists:[{
                            fsym: fsym,
                            tsym: tsym,
                            time: res.data.data.timePoint,
                            rate: res.data.data.value
                        }],
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.market.getFundingRate:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.market.getFundingRate.err: ${err}`);
            })
            logger.info(`kucoin.future.market.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.market.getFundingRate.error: ${error}`);
            return response;
        }
    }


}
module.exports = {Market}