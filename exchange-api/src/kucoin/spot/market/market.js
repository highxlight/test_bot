const {axios, getDecimal, logger} = require("../../../utils/utils");

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
     * get24hTickerStatistic
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
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/v1/market/stats?symbol=${symbol}`;
            logger.debug(`kucoin.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        priceChange: res.data.data.changePrice,
                        priceChangePercent: res.data.data.changeRate,
                        openPrice: '',
                        highPrice: res.data.data.high,
                        lowPrice: res.data.data.low,
                        volume: res.data.data.vol,
                        quoteVolume:res.data.data.volValue,
                        lastPrice: res.data.data.last,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`kucoin.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.market.get24hTickerStatistic.error: ${error}`);
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
        const method = 'GET'
        const timestamp=Date.now().toString();
        let symbol = `${fsym}-${tsym}`;
        const endpoint =  `/api/v1/market/orderbook/level2_100?symbol=${symbol}`;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        asks: res.data.data.asks,
                        bibs: res.data.data.bids,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`kucoin.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.market.getOrderBook.error: ${error}`);
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
            interval=interval+'in'
        }else if(interval.endsWith('M')){
            interval= interval.toLowerCase()+'on'
        }else if(interval.endsWith('d')){
            interval= interval+'ay'
        }else if(interval.endsWith('w')){
            interval= interval+'eek'
        }else if(interval.endsWith('y')){
            interval= interval+'ear'
        }else if(interval.endsWith('h')){
            interval= interval+'our'
        }else{
            interval ='1day'
        }
        let symbol =`${fsym}-${tsym}`;
        let endpoint = `/api/v1/market/candles?type=${interval}&symbol=${symbol}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint += `&startAt=${parseInt(options[key]/ 1000)}`;
                }
                if(key === 'endTime'){
                    endpoint += `&endAt=${parseInt(options[key]/ 1000)}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.spot.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    let lists = [];
                    let listData = [];
                    res.data.data.forEach(item=>{
                        let dicData= {
                            open_time: parseInt(item[0]) * 1000,
                            open: item[1],
                            high:item[3],
                            low: item[4],
                            close:item[2],
                            volume:item[5],
                            close_time: '',
                            turnover: item[6]
                        }
                        if(options.limit && parseInt(options.limit) > 0){
                            if(listData.length < options.limit){
                                listData.push(dicData);
                            }else{
                                return;
                            }
                        }else {
                            listData.push(dicData)
                        }
                    })
                    lists = listData.reverse();
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        interval: interv,
                        lists:lists,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`kucoin.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.market.getKlineHistory.error: ${error}`);
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
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/v1/symbols`;
            logger.debug(`kucoin.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    let dicData = {};
                    res.data.data.forEach(item=>{
                        if(item.symbol === symbol){
                            dicData.minPrice = item.quoteMinSize;
                            dicData.maxPrice = item.quoteMaxSize;
                            dicData.tickSize = getDecimal(item.quoteIncrement);
                            dicData.minQty = item.baseMinSize;
                            dicData.maxQty = item.baseMaxSize;
                            dicData.stepSize= getDecimal(item.baseIncrement);
                        }
                    })
                    dicData.fsym = fsym;
                    dicData.tsym = tsym;
                    dicData.ename = 'kucoin';
                    dicData.rawData = res.data;
                    response.success = true;
                    response.data = dicData
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`kucoin.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/api/v1/symbols`;
            logger.debug(`kucoin.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    let lists = [];
                    res.data.data.forEach(item=>{
                        let dicData = {
                            symbol: item.symbol,
                            fsym: item.baseCurrency,
                            tsym: item.quoteCurrency,
                            tickSize: item.priceIncrement,
                            baseAssetPrecision: getDecimal(item.baseIncrement),
                            quoteAssetPrecision: getDecimal(item.quoteIncrement)
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
                    msg: 'kucoin.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`kucoin.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.market.getAllSymbolInfo.error: ${error}`);
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
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/v1/market/orderbook/level1?symbol=${symbol}`;
            logger.debug(`kucoin.spot.market.getMarketPrice.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data ={
                        fsym: fsym,
                        tsym: tsym,
                        ename:'kucoin',
                        price: parseFloat(res.data.data.price),
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.spot.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`kucoin.spot.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.market.getMarketPrice.error: ${error}`);
            return response;
        }
    }
}
module.exports={Market}