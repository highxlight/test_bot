const {axios,logger, getDecimal} = require("../../../utils/utils");

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
     * getOrderBook
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrderBook(fsym, tsym, options){
        let response = {
            success:false,
            data:null
        };
        try{
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/v2/public/get_order_book?instrument_name=${symbol}`;
            logger.debug(`deribit.future.market.getOrderBook.url: ${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data ={
                    fsym: fsym,
                    tsym: tsym,
                    ename:'deribit',
                    asks: res.data.result.asks,
                    bids: res.data.result.bids,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`deribit.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.market.getOrderBook.error: ${error}`);
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
        };
        try{
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/v2/public/get_instrument?instrument_name=${symbol}`;
            logger.debug(`deribit.future.market.getValidSymbol.url: ${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data ={
                    fsym: fsym,
                    tsym: tsym,
                    ename:'deribit',
                    minPrice: null,
                    maxPrice: null,
                    tickSize: getDecimal(res.data.result.tick_size),
                    minQty:  res.data.result.min_trade_amount,
                    maxQty: null,
                    stepSize: 0,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`deribit.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.market.getValidSymbol.error: ${error}`);
            return response;
        }
    }

    /**
     * getAllSymbolInfo
     * @param fsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAllSymbolInfo(fsym){
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v2/public/get_instruments?currency=${fsym}&kind=future`;
            logger.debug(`deribit.future.market.getAllSymbolInfo.url: ${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                let lists = [];
                res.data.result.forEach(item=>{
                    if(item.kind === 'future'){
                        let dicData = {
                            symbol: item.instrument_name,
                            fsym: item.base_currency,
                            tsym: item.quote_currency,
                            tickSize: item.tick_size,
                            baseAssetPrecision: 0,
                            quoteAssetPrecision: getDecimal(item.tick_size)
                        }
                       lists.push(dicData);
                    }
                })
                response.data = {
                    ename:'deribit',
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`deribit.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.market.getAllSymbolInfo.error: ${error}`);
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
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/v2/public/get_funding_rate_history?instrument_name=${symbol}`;
            if(options){
                for(let key in options){
                    if(options[key]){
                        if(key === 'startTime'){
                            endpoint += `&start_timestamp=${options[key]}`;
                        }else if(key === 'endTime'){
                            endpoint += `&end_timestamp=${options[key]}`;
                        }
                    }
                }
            }
            logger.debug(`deribit.future.market.getFundingRate.url: ${endpoint}`)
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                let lists = [];
                res.data.result.forEach(item=>{
                    let dicData = {
                        fsym: fsym,
                        tsym: tsym,
                        time: item.timestamp,
                        rate: item.index_price
                    }
                    lists.push(dicData);
                })
                response.data = {
                    ename:'deribit',
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.market.getFundingRate:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.market.getFundingRate.err: ${err}`);
            })
            logger.info(`deribit.future.market.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Market}