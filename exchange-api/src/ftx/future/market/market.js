const {axios, getDecimal, timeFormat,numToString, logger} = require("../../../utils/utils");

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
        let symbol=`${fsym}-${tsym}`;
        const endpoint = `/api/markets/${symbol}/orderbook?depth=100`
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`ftx.future.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'ftx',
                        asks: res.data.result.asks,
                        bids: res.data.result.bids,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.market.getOrderBook.err: ${err}`);
            })
            logger.info(`ftx.future.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

    /**
     *
     * @param fsym
     * @param tsym
     * @param interval
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getKlineHistory(fsym, tsym, interval, options){
        let response = {
            success:false,
            data:null
        }
        try {
            let interv = interval;
            let num =  parseInt(interval.substring(0, interval.length - 1));
            if(interval.endsWith('m')){
                interval = num * 60;
            }else if(interval.endsWith('h')){
                interval = num * 60 * 60;
            }else if(interval.endsWith('d')){
                interval = num * 24 * 60 * 60;
            }else if(interval.endsWith('w')){
                interval = num * 7 * 24 * 60 * 60;
            }else if(interval.endsWith('M')){
                interval = num * 30 * 24 * 60 * 60;
            }else if(interval.endsWith('y')){
                interval = num * 365 * 24 * 60 * 60
            }else{
                interval = num * 24 * 60 * 60;
            }
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/markets/${symbol}/candles?resolution=${interval}`;
            if(options){
                for(let key in options){
                    if(key === 'startTime'){
                        endpoint += `&start_time=${options[key]}`;
                    }
                    if(key === 'endTime'){
                        endpoint += `&end_time=${options[key]}`;
                    }
                }
            }
            logger.debug(`ftx.future.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    let lists = [];
                    res.data.result.reverse();
                    res.data.result.forEach(item=>{
                        let dicData={
                            open_time: timeFormat(item.time),
                            open: item.open,
                            high: item.high,
                            low:  item.low,
                            close: item.close,
                            volume: item.volume,
                            close_time: '',
                            turnover: ''
                        }
                        if(options.limit && parseInt(options.limit) > 0){
                            if(lists.length < parseInt(options.limit)){
                                lists.push(dicData);
                            }else{
                                return;
                            }
                        }else{
                            lists.push(dicData);
                        }
                    })
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'ftx',
                        interval:interv,
                        lists: lists.reverse(),
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`ftx.future.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.market.getKlineHistory.error: ${error}`);
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
            let endpoint = `/api/markets/${symbol}`;
            logger.debug(`ftx.future.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    let item = res.data.result;
                    let data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'ftx',
                        minPrice: '',
                        maxPrice: '',
                        tickSize: getDecimal(item.priceIncrement),
                        minQty:  '',
                        maxQty: '',
                        stepSize: getDecimal(item.sizeIncrement),
                        rawData: item
                    };
                    response.success = true;
                    response.data = data;
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`ftx.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/api/markets`;
            logger.debug(`ftx.future.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    let lists = [];
                    res.data.result.forEach(item =>{
                        if(item.type.toLowerCase() === 'future'){
                            let sizeIncrement = item.sizeIncrement;
                            let priceIncrement = item.priceIncrement;
                            if(sizeIncrement.toString().indexOf('e-') != -1){
                                sizeIncrement = sizeIncrement.toString().split('e-')[1];
                            }
                            if(priceIncrement.toString().indexOf('e-') != -1){
                                priceIncrement = priceIncrement.toString().split('e-')[1];
                            }
                            let sym = item.name.split('-');
                            var tsym = '';
                            sym.forEach((item, key)=>{
                                if(item !== sym[0] ){
                                    if(key < sym.length-1){
                                        tsym += `${item}-`
                                    }else{
                                        tsym += `${item}`
                                    }
                                }
                            })
                            let dicData = {
                                symbol: item.name,
	                            fsym: sym[0],
                                tsym: tsym,
                                tickSize: numToString(item.priceIncrement),
                                baseAssetPrecision: getDecimal(sizeIncrement),
                                quoteAssetPrecision: getDecimal(priceIncrement)
                            }
                            lists.push(dicData);
                        }
                    })
                    response.success = true;
                    response.data = {
                        ename:'ftx',
                        lists: lists,
                        rawData: res.data
                    };
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`ftx.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.market.getAllSymbolInfo.error: ${error}`);
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
            let endpoint = `/api/markets/${symbol}/trades`;
            logger.debug(`ftx.future.market.getMarketPrice.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    let listData = res.data.result;
                    response.success = true;
                    response.data ={
                        fsym: fsym,
                        tsym: tsym,
                        ename:'ftx',
                        price: listData[0].price,
                        rawData: listData
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`ftx.future.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.market.getMarketPrice.error: ${error}`);
            return response;
        }
    }

    /**
     * getFundingRate
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getFundingRate(fsym, tsym, options){
        let response = {
            success:false,
            data:null
        };
        try{
            let symbol = `${fsym}-${tsym}`;
            let endpoint = `/api/funding_rates?future=${symbol}`;
            if(options){
                for(let key in options){
                    if(key === 'startTime'){
                        endpoint += `&start_time=${options[key]}`;
                    }
                    if(key === 'endTime'){
                        endpoint += `&end_time=${options[key]}`;
                    }
                }
            }
            logger.debug(`ftx.future.getFundingRate.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.success){
                    let lists = [];
                    res.data.result.forEach(item=>{
                        let dicData = {
                            fsym: fsym,
                            tsym: tsym,
                            time: timeFormat(item.time),
                            rate: item.rate
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'ftx',
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.getFundingRate.err: ${err}`);
            })
            logger.info(`ftx.future.getFundingRate.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.getFundingRate.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Market}
