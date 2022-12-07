const {axios, logger } = require("../../../utils/utils");

class Market {

    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(apiKey, secretKey, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: `${endpoint}`, timeout: timeout});
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
        const endpoint=`/public?command=returnOrderBook&currencyPair=${symbol}&depth=10`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`poloniex.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if('error' in res.data){
                    response.success = false;
                    response.data = {
                        code: null,
                        msg: res.data.error
                    }
                }else{
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        asks: res.data.asks,
                        bids: res.data.bids,
                        ename:'poloniex',
                        rawData: res.data
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloniex.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloniex.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`poloniex.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.spot.market.getOrderBook.error: ${error}`);
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
        let interv = parseInt(interval);
        if(interval.endsWith('m')){
            interval= interv * 60;
        }else if(interval.endsWith('h')){
            interval= interv * 60 * 60
        }else if(interval.endsWith('d')){
            interval= interv * 24 * 60 * 60
        }else if(interval.endsWith('w')){
            interval= interv * 7 * 24 * 60 * 60
        }else{
            interval =300
        }
        let symbol = `${fsym}_${tsym}`;
        let  endpoint=`/public?command=returnChartData&currencyPair=${symbol}&period=${interval}`;
        let start = null, end = null;
        if(options){
            for (let key in options){
                if(key === 'startTime'){
                    start = Math.floor(options[key] / 1000);
                }else if(key === 'endTime'){
                    end = Math.floor(options[key] / 1000);
                }
            }
        }
        if(!start && !end){
            start = Math.floor((Date.now() - 24*60*60*1000) / 1000);
            end = Math.floor((Date.now()) / 1000);
        }
        endpoint += `&start=${start}&end=${end}`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`poloniex.spot.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if('error' in res.data){
                    response.success = false;
                    response.data = {
                        code: null,
                        msg: res.data.error
                    }
                }else{
                    let result = res.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: Math.floor(item.date * 1000),
                            open: item.open,
                            high: item.high,
                            low: item.low,
                            close: item.close,
                            volume: item.volume,
                            close_time: '',
                            turnover: item.quoteVolume
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'poloniex',
                        interval: interval,
                        lists: lists,
                        rawData: res.data
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloniex.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloniex.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`poloniex.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.spot.market.getKlineHistory.error: ${error}`);
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
            let endpoint = `/public?command=returnTicker`;
            logger.debug(`poloniex.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if('error' in res.data){
                    response.success = false
                    response.data={
                        code: null,
                        msg: res.data.error
                    }
                }else{
                    let result = res.data;
                    let data = null;
                    for(let key in result){
                        if(key === symbol){
                            data= {
                                fsym: fsym,
                                tsym: tsym,
                                minPrice: null,
                                maxPrice: null,
                                ename:'poloniex',
                                tickSize: null,
                                minQty:  null,
                                maxQty: null,
                                stepSize:null,
                                rawData: result[key]
                            }
                            break;
                        }
                    }
                    response.success = true;
                    response.data = data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloniex.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloniex.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`poloniex.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/public?command=returnTicker`;
            logger.debug(`poloniex.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data;
                let lists = [];
                for(let key in result){
                    let pairs = key.split('_');
                    let dicData = {
                        symbol: key,
	                    fsym: pairs[0],
                        tsym: pairs[1],
                        tickSize: 0,
                        baseAssetPrecision: 0,
                        quoteAssetPrecision: 0
                    }
                    lists.push(dicData);
                }
                response.success = true;
                response.data = {
                    ename:'poloniex',
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloniex.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloniex.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`poloniex.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.spot.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Market}