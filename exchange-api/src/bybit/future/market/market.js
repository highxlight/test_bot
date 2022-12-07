const {axios, getDecimal, logger} = require("../../../utils/utils");

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
        let symbol = `${fsym}${tsym}`;
        const endpoint = '/v2/public/orderBook/L2?symbol='+symbol;
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.future.market.getOrderBook.url:${endpoint}`)
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.ret_code === 0){
                    let asks = [], bids = [];
                    res.data.result.forEach(item=>{
                        if(item.side.toLowerCase() === 'buy'){
                            asks.push([item.price, item.size]);
                        }else if(item.side.toLowerCase() === 'sell'){
                            bids.push([item.price, item.size]);
                        }
                    })
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        asks: asks,
                        bids: bids,
                        ename:'bybit',
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`bybit.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.market.getOrderBook.error: ${error}`);
            return response
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
        if(tsym === 'USDT'){
            symbol = `${fsym}USD`;
        }
        let interv = '';
        if(interval.endsWith('m')){
            interv = parseInt(interval);
        }else if(interval.endsWith('M')){
            interv = 'M';
        }else if(interval.endsWith('d')){
            interv = 'D';
        }else if(interval.endsWith('w')){
            interv = 'W';
        }else{
            interv = 'D';
        }
        let endpoint = `/v2/public/kline/list?symbol=${symbol}&interval=${interv}`;
        if(options){
            for(let key in options){
                if(options[key]){
                    if(key === 'startTime'){
                        endpoint += `&from=${ Math.ceil(options[key] / 1000)}`;
                    }else{
                        endpoint += `&to=${Math.ceil(Date.now()/ 1000) }`;
                    }
                    if(key === 'limit'){
                        endpoint += `&limit=${options[key]}`;
                    }
                }
            }
        }else{
            endpoint += `&from=${Math.ceil(Date.now()/ 1000) - 86400 }`;
        }
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.future.market.getKlineHistory.url:${endpoint}`)
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    let lists = [];
                    if(res.data.result){
                        res.data.result.forEach(item=>{
                            let dicData={
                                open_time: parseInt(item.open_time) * 1000,
                                open: item.open,
                                high: item.high,
                                low: item.low,
                                close:item.close,
                                volume: item.volume,
                                close_time: '',
                                turnover: item.turnover
                            }
                            lists.push(dicData);
                        })
                    }
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        interval: interval,
                        lists: lists,
                        ename:'bybit',
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`bybit.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.market.getKlineHistory.error: ${error}`);
            return response
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
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/v2/public/symbols`
            logger.debug(`bybit.future.market.getValidSymbol.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    let data = {};
                    res.data.result.forEach(item=>{
                        if(item.name === symbol){
                            data={
                                minPrice: item.price_filter.min_price,
                                maxPrice: item.price_filter.max_price,
                                tickSize: getDecimal(item.price_filter.tick_size),
                                minQty: item.lot_size_filter.min_trading_qty,
                                maxQty: item.lot_size_filter.max_trading_qty,
                                stepSize: getDecimal(item.lot_size_filter.qty_step)
                            }
                        }
                    })
                    data.fsym = fsym;
                    data.tsym = tsym;
                    data.ename = 'bybit';
                    data.rawData = res.data;
                    response.data = data
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`bybit.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.market.getValidSymbol.error: ${error}`);
            return response
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
        };
        try{
            let endpoint = `/v2/public/symbols`
            logger.debug(`bybit.future.market.getValidSymbol.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    let lists = [];
                    res.data.result.forEach(item=>{
                        let dicData = {
                            symbol: item.name,
                            fsym: item.base_currency,
                            tsym: item.quote_currency,
                            tickSize: item.price_filter.tick_size,
                            baseAssetPrecision: getDecimal(item.lot_size_filter.qty_step),
                            quoteAssetPrecision: getDecimal(item.price_filter.tick_size),
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'bybit',
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`bybit.future.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.market.getValidSymbol.error: ${error}`);
            return response
        }
    }

}
module.exports={Market}