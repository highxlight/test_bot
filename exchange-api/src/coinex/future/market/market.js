const {axios, getDecimal, logger } = require("../../../utils/utils");

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
    async getValidSymbol(fsym, tsym){
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/market/list`;
            logger.debug(`coinex.future.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.data;
                    result.forEach(item=>{
                        if(symbol === item.name){
                            let dicData = {
                                fsym: item.stock,
                                tsym: item.money,
                                minPrice: null,
                                maxPrice: null,
                                ename:'coinex',
                                tickSize: item.stock_prec,
                                minQty:  item.amount_min,
                                maxQty: null,
                                stepSize:item.money_prec,
                                rawData: res.data
                            };
                            response.success = true;
                            response.data = dicData;
                            return;
                        }
                    })
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'coinex.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`coinex.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`coinex.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/market/list`;
            logger.debug(`coinex.future.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            symbol: item.name,
                            ename: 'coinex',
                            fsym: item.stock,
                            tsym: item.money,
                            tickSize: item.tick_size,
                            baseAssetPrecision: item.stock_prec,
                            quoteAssetPrecision: item.money_prec
                        };
                        lists.push(dicData)
                    })
                    response.success = true;
                    response.data = {
                        lists: lists,
                        rawData: res.data
                    };
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'coinex.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`coinex.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`coinex.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.market.getAllSymbolInfo.error: ${error}`);
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
        let interv = '';
        if(interval.endsWith('m')){
            interv = interval+'in';
        }else if(interval.endsWith('h')){
            interv = interval+'our';
        }if(interval.endsWith('d')){
            interv = interval+'ay';
        }if(interval.endsWith('w')){
            interv = interval+'week';
        }else{
            interv = '1min';
        }
        let endpoint=`/market/kline?market=${symbol}&type=${interv}`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: parseInt(item[0]) * 1000,
                            open: item[1],
                            high: item[3],
                            low: item[4],
                            close: item[2],
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
                        ename:'coinex',
                        interval: interval,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        message: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'coinex.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`coinex.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`coinex.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.market.getKlineHistory.error: ${error}`);
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
        let endpoint=`/market/depth?market=${symbol}&merge=0.01&limit=100`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    response.success =true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        asks: res.data.data.asks,
                        bids: res.data.data.bids,
                        ename:'coinex',
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        message: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'coinex.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`coinex.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`coinex.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.market.getOrderBook.error: ${error}`);
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
        let symbol = `${fsym}${tsym}`;
        let endpoint=`/market/funding_history?market=${symbol}&offset=0&limit=100`;
        if(options){
            for(let key in options){
                if(key === 'start_time'){
                    endpoint += `&startTime=${options[key]}`;
                }else if(key === 'end_time'){
                    endpoint += `&endTime=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.market.getFundingRate.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let lists = [];
                    let result = res.data.data.records;
                    result.forEach(item=>{
                        let dicData = {
                            fsym: fsym,
                            tsym: tsym,
                            time: Math.floor(item.time * 1000),
                            rate: item.funding_rate,
                            ename:'coinex',
                            rawData: res.data
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        lists: lists,
                        ename:'coinex',
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        message: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'coinex.future.market.getFundingRate:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`coinex.future.market.getFundingRate.err: ${err}`);
            })
            logger.info(`coinex.future.market.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.market.getFundingRate.error: ${error}`);
            return response;
        }
    }
}

module.exports = {Market}