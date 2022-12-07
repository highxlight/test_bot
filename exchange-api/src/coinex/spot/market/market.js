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
     *  get24hTickerStatistic
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        };
        let symbol = `${fsym}${tsym}`;
        let endpoint =`/market/ticker?market=${symbol}`;
        logger.info(`coinex.spot.market.get24hTickerStatistic.req: ${symbol}`)
        try{
            logger.debug(`coinex.spot.market.get24hTickerStatistic.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                if(res.data.code === 0){
                    let result = res.data.data.ticker;
                    let data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: 'coinex',
                        priceChange: '', // 涨跌价
                        priceChangePercent: '', //涨跌幅
                        openPrice: result.open, //开盘价
                        highPrice: result.high, // 最高价
                        lowPrice: result.low, // 最低价
                        volume: result.vol, //成交量
                        quoteVolume: '', //成交金额
                        lastPrice: result.last, //最新成交价格
                        rawData: res.data
                    }
                    response.data = data
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
                    msg: 'coinex.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`coinex.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`coinex.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.info(`coinex.spot.market.get24hTickerStatistic.error: ${error}`)
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
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/market/detail?market=${symbol}`;
            logger.debug(`coinex.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.data;
                    let dicData = {
                        fsym: result.trading_name,
                        tsym: result.pricing_name,
                        minPrice: null,
                        maxPrice: null,
                        ename:'coinex',
                        tickSize: result.pricing_decimal,
                        minQty:  result.min_amount,
                        maxQty: null,
                        stepSize:result.trading_decimal,
                        rawData: res.data
                    };
                    response.success = true;
                    response.data = dicData;
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
                    msg: 'coinex.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`coinex.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`coinex.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/market/info`;
            logger.debug(`coinex.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.code === 0){
                    let result = res.data.data;
                    let lists = [];
                    for(let key in result){
                        let item = result[key];
                        let dicData = {
                            symbol: item.name,
                            ename: 'coinex',
                            fsym: item.trading_name,
                            tsym: item.pricing_name,
                            tickSize: 0,
                            baseAssetPrecision: item.trading_decimal,
                            quoteAssetPrecision: item.pricing_decimal
                        }
                        lists.push(dicData);
                    }
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
                    msg: 'coinex.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`coinex.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`coinex.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.market.getAllSymbolInfo.error: ${error}`);
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
            logger.debug(`coinex.spot.market.getKlineHistory.url: ${endpoint}`);
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
                    msg: 'coinex.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`coinex.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`coinex.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.market.getKlineHistory.error: ${error}`);
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
        let endpoint=`/market/depth?market=${symbol}&merge=0.00000001&limit=50`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.market.getOrderBook.url: ${endpoint}`);
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
                    msg: 'coinex.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`coinex.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`coinex.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Market}