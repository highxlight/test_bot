const {axios, getDecimal, numToString, logger} = require('../../../utils/utils')

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
        let symbol = `${fsym}-${tsym}`;
        const endpoint = `/linear-swap-ex/market/depth?contract_code=${symbol}&type=step5`
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.future.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.status === 'ok'){
                    let result =  res.data.tick;
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        asks: result.asks,
                        bids: result.bids,
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`huobi.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.market.getOrderBook.error: ${error}`);
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
        let symbol = `${fsym}-${tsym}`;
        let endpoint = `/linear-swap-ex/market/history/kline?contract_code=${symbol}&period=${interval}`;
        for(let key in options){
            if(key === 'startTime'){
                endpoint += `&from=${options[key]}`;
            }
            if(key === 'endTime'){
                endpoint += `&to=${options[key]}`;
            }
            if(key === 'limit'){
                endpoint += `&size=${options[key]}`;
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.future.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.status === 'ok'){
                    let result =  res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            open_time: parseInt(item.id) * 1000,
                            open: item.open,
                            high: item.high,
                            low:  item.low,
                            close: item.close,
                            volume: item.amount,
                            close_time: '',
                            turnover: item.trade_turnover
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        interval: interv,
                        lists:lists,
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`huobi.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.market.getKlineHistory.error: ${error}`);
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
            let endpoint =`/linear-swap-api/v1/swap_contract_info?contract_code=${symbol}`;
            logger.debug(`huobi.future.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    let result =  res.data.data;
                    let size = result[0].contract_size;
                    let tick = result[0].price_tick;
                    if(size.toString().indexOf('e-') != -1){
                        size = size.toString().split('e-')[1];
                    }
                    if(tick.toString().indexOf('e-') != -1){
                        tick = tick.toString().split('e-')[1];
                    }
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        minPrice:'',
                        maxPrice:'',
                        tickSize: getDecimal(tick),
                        minQty: '',
                        maxQty: '',
                        stepSize: getDecimal(size),
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`huobi.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.market.getValidSymbol.error: ${error}`);
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
            let endpoint =`/linear-swap-api/v1/swap_contract_info`;
            logger.debug(`huobi.future.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    let result =  res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let size = item.contract_size;
                        let tick = item.price_tick;
                        if(size.toString().indexOf('e-') != -1){
                            size = size.toString().split('e-')[1];
                        }
                        if(tick.toString().indexOf('e-') != -1){
                            tick = tick.toString().split('e-')[1];
                        }
                        let dicData = {
                            symbol: item.pair,
	                        fsym: item.symbol,
                            tsym: item.trade_partition,
                            tickSize: numToString(item.price_tick),
                            baseAssetPrecision: getDecimal(size),
                            quoteAssetPrecision: getDecimal(tick)
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'huobi',
                        lists:lists,
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`huobi.future.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.market.getAllSymbolInfo.error: ${error}`);
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
            let symbol = `${tsym}-${fsym}`;
            let endpoint = `/linear-swap-api/v1/swap_funding_rate?contract_code=${symbol}`;
            logger.debug(`huobi.future.market.getFundingRate.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    let result =  res.data.data;
                    let lists  = [{
                        fsym: fsym,
                        tsym: tsym,
                        time: result.funding_time,
                        rate: result.funding_rate
                    }]
                    response.success = true;
                    response.data = {
                        ename:'huobi',
                        lists:lists,
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.market.getFundingRate:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.market.getFundingRate.err: ${err}`);
            })
            logger.info(`huobi.future.market.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.market.getFundingRate.error: ${error}`);
            return response;
        }
    }


}
module.exports = {Market}