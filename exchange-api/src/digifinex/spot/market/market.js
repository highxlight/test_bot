const {axios, getDecimal, logger } = require("../../../utils/utils");
const errorCode = require('../errorCode')


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
    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol = `${fsym}_${tsym}`;
            let endpoint = `/ticker`;
            let queryString = `symbol=${symbol.toLowerCase()}`;
            logger.debug(`digifinex.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.ticker;
                    let dicData = null;
                    result.forEach(item=>{
                        let pairs = item.symbol.split('_');
                        dicData = {
                            fsym: pairs[0].toUpperCase(),
                            tsym: pairs[1].toUpperCase(),
                            ename:'digifinex',
                            priceChange: item.change,
                            priceChangePercent: '',
                            openPrice: null,
                            lowPrice: item.low,
                            volume: parseFloat(item.vol).toFixed(8),
                            quoteVolume: parseFloat(item.base_vol).toFixed(8),
                            lastPrice: item.low,
                            rawData: item
                        };
                    })
                    response.success = true;
                    response.data = dicData;
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode(res.data.code),
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`digifinex.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`digifinex.spot.market.get24hTickerStatistic.error: ${error}`);
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
            let endpoint = `/spot/symbols`;
            logger.debug(`digifinex.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.symbol_list;
                    let dicData = {};
                    result.forEach(item=>{
                        if(symbol === item.symbol){
                            dicData = {
                                fsym: item.base_asset.toUpperCase(),
                                tsym: item.quote_asset.toUpperCase(),
                                minPrice: null,
                                maxPrice: null,
                                ename:'digifinex',
                                tickSize: item.price_precision,
                                minQty:  item.minimum_amount,
                                maxQty: null,
                                stepSize: item.amount_precision,
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
                        msg: errorCode(res.data.code),
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`digifinex.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`digifinex.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/spot/symbols`;
            logger.debug(`digifinex.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.symbol_list;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            symbol: item.symbol,
                            fsym: item.base_asset.toUpperCase(),
                            tsym: item.quote_asset.toUpperCase(),
                            tickSize: 0,
                            baseAssetPrecision: item.price_precision,
                            quoteAssetPrecision: item.amount_precision
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: 'digifinex',
                        lists: lists,
                        rawData: res.data
                    };
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode(res.data.code),
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`digifinex.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`digifinex.spot.market.getAllSymbolInfo.error: ${error}`);
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
            interval= parseInt(interval);
        }else if(interval.endsWith('M')) {
            interval= parseInt(interval) * 30 * 24 * 60;
        }else if(interval.endsWith('d')) {
            interval= parseInt(interval) * 24 * 60;
        }else if(interval.endsWith('w')) {
            interval= parseInt(interval) * 7 * 24 * 60;
        }else if(interval.endsWith('h')) {
            interval= parseInt(interval) * 60;
        }else if(interval.endsWith('y')) {
            interval= parseInt(interval) * 365 * 24 * 60;
        }else{
            interval = 1
        }
        let symbol = `${fsym}_${tsym}`;
        let endpoint=`/kline?symbol=${symbol.toLowerCase()}&step=${interval}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint+= `&start_time=${Math.floor(options[key]/ 1000)}`;
                }else if(key === 'endTime'){
                    endpoint+= `&end_time=${Math.floor(options[key]/ 1000)}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`digifinex.spot.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: parseInt(item[0]) * 1000,
                            open: item[5],
                            high: item[3],
                            low: item[4],
                            close: item[2],
                            volume:item[1],
                            close_time: '',
                            turnover:parseFloat(item.quote_volume).toFixed(8)
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'digifinex',
                        interval: interv,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode(res.data.code)
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`digifinex.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`digifinex.spot.market.getKlineHistory.error: ${error}`);
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
        let symbol = `${fsym}_${tsym}`;
        let endpoint=`/order_book?symbol=${symbol.toLowerCase()}`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`digifinex.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        asks: result.asks.reverse(),
                        bids: result.bids,
                        ename:'digifinex',
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode(res.data.code)
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`digifinex.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`digifinex.spot.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Market}