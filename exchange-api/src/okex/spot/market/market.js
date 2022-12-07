const {axios,getDecimal, logger } = require("../../../utils/utils");

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
     * get24hTickerStatistic
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async get24hTickerStatistic(fsym, tsym){
        let symbol = `${fsym}-${tsym}`;
        const endpoint= `/api/v5/market/ticker?instId=${symbol}`
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data[0];
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'okex',
                        priceChange: '',
                        priceChangePercent: '',
                        openPrice: result.open24h,
                        highPrice: result.high24h,
                        lowPrice: result.low24h,
                        volume: result.vol24h,
                        quoteVolume: result.volCcy24h,
                        lastPrice: result.last,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`okex.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.market.get24hTickerStatistic.error: ${error}`);
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
        let symbol = `${fsym}-${tsym}`;
        const endpoint=`/api/v5/market/books?instId=${symbol}`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '0'){
                    let asks = [], bids = [];
                    let result = res.data.data[0];
                    result.asks.forEach(item=>{
                        let lisa = [item[0], item[3]];
                        asks.push(lisa);
                    })
                    result.bids.forEach(item=>{
                        let lisb = [item[0], item[3]];
                        bids.push(lisb);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        asks: asks,
                        bids: bids,
                        ename:'okex',
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`okex.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.market.getOrderBook.error: ${error}`);
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
        if(!interval.endsWith('m')){
            interval=interval.toUpperCase()
        }
        let symbol = `${fsym}-${tsym}`;
        let endpoint=`api/v5/market/history-candles?instId=${symbol}&bar=${interval}`;
        if(options){
            for (let key in options){
                if(key === 'limit'){
                    endpoint += `&limit=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: item[0],
                            open: item[1],
                            high: item[2],
                            low: item[3],
                            close: item[4],
                            volume:item[5],
                            close_time: '',
                            turnover: item[6]
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'okex',
                        interval: interval,
                        lists: lists.reverse(),
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`okex.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.market.getKlineHistory.error: ${error}`);
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
            let endpoint = `/api/v5/public/instruments?instType=SPOT&instId=${symbol}`;
            logger.debug(`okex.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data[0];
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        minPrice: '',
                        maxPrice: '',
                        ename:'okex',
                        tickSize: getDecimal(result.tickSz),
                        minQty:  result.minSz,
                        maxQty: '',
                        stepSize: getDecimal(result.lotSz),
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`okex.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/api/v5/public/instruments?instType=SPOT`;
            logger.debug(`okex.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            symbol: item.instId,
                            fsym: item.baseCcy,
                            tsym: item.quoteCcy,
                            tickSize: item.tickSz,
                            baseAssetPrecision: getDecimal(item.lotSz),
                            quoteAssetPrecision: getDecimal(item.tickSz)
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'okex',
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`okex.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }

    /**
     * getMarketPRice
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
            let endpoint = `/api/v5/market/ticker?instId=${symbol}`;
            logger.debug(`okex.spot.market.getMarketPrice.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === '0'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'okex',
                        price: res.data.data[0].last,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`okex.spot.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.market.getMarketPrice.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Market}