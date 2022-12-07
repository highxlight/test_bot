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
    async get24hTickerStatistic(fsym, tsym){
        let response = {
            success:false,
            data:null
        }
        try{
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/api/v1/ticker/24hr?symbol=${symbol}`;
            logger.debug(`bitrue.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data;
                let dicData = null;
                result.forEach(item=>{
                    dicData = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'bitrue',
                        priceChange: item.priceChange,
                        priceChangePercent: item.priceChangePercent,
                        openPrice: item.openPrice,
                        highPrice: item.highPrice,
                        lowPrice: item.lowPrice,
                        volume: parseFloat(item.volume).toFixed(8),
                        quoteVolume: parseFloat(item.quoteVolume).toFixed(8),
                        lastPrice: item.lastPrice,
                        rawData: item
                    };
                })
                response.success = true;
                response.data = dicData;
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`bitrue.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.market.get24hTickerStatistic.error: ${error}`);
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
            let symbol = `${fsym}${tsym}`;
            let endpoint = `/api/v1/ticker/price?symbol=${symbol}`;
            logger.debug(`bitrue.spot.market.getMarketPrice.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data;
                response.success = true;
                response.data = {
                    ename: 'bitrue',
                    fsym:fsym,
                    tsym:tsym,
                    price: result.price,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`bitrue.spot.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.market.getMarketPrice.error: ${error}`);
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
            let endpoint = `/api/v1/exchangeInfo`;
            logger.debug(`bitrue.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data.symbols;
                let dicData = {};
                result.forEach(item=>{
                    if(symbol === item.symbol){
                        let priceFilter = {};
                        let lotSize = {};
                        item.filters.forEach(itm=>{
                            if(itm.filterType === 'PRICE_FILTER'){
                                priceFilter = itm;
                            }else if(itm.filterType === 'LOT_SIZE'){
                                lotSize = itm;
                            }
                        })
                        dicData = {
                            fsym: item.baseAsset.toUpperCase(),
                            tsym: item.quoteAsset.toUpperCase(),
                            minPrice: priceFilter.minPrice,
                            maxPrice: priceFilter.maxPrice,
                            ename:'bitrue',
                            tickSize: item.baseAssetPrecision,
                            minQty: lotSize.minQty,
                            maxQty: lotSize.maxQty,
                            stepSize: item.quotePrecision,
                            rawData: item
                        }
                    }
                })
                response.success = true;
                response.data = dicData;
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`bitrue.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/api/v1/exchangeInfo`;
            logger.debug(`bitrue.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data.symbols;
                let lists = [];
                result.forEach(item=>{
                    let dicData = {
                        symbol: item.symbol,
                        fsym: item.baseAsset.toUpperCase(),
                        tsym: item.quoteAsset.toUpperCase(),
                        tickSize: item.filters[0].minPrice,
                        baseAssetPrecision: item.baseAssetPrecision,
                        quoteAssetPrecision: item.quotePrecision
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    ename: 'bitrue',
                    lists: lists,
                    rawData: res.data
                };
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`bitrue.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.market.getAllSymbolInfo.error: ${error}`);
            return response;
        }
    }

    // /**
    //  * getKlineHistory
    //  * @param fsym
    //  * @param tsym
    //  * @param interval
    //  * @param options
    //  * @returns {Promise<{data: null, success: boolean}>}
    //  */
    // async getKlineHistory(fsym, tsym, interval, options){
    //     let symbol = `${fsym}${tsym}`;
    //     let endpoint=`/api/v1/kline?symbol=${symbol}&interval=${interval}`;
    //     let response = {
    //         success:false,
    //         data:null
    //     }
    //     try{
    //         logger.debug(`bitrue.spot.market.getKlineHistory.url: ${endpoint}`);
    //         await this.axiosInstance.get(endpoint).then(res=>{
    //             let result = res.data.data.klines;
    //             let lists = [];
    //             result.forEach(item=>{
    //                 let dicData = {
    //                     open_time: item.timestamp,
    //                     open: item.open,
    //                     high: item.high,
    //                     low: item.low,
    //                     close: item.close,
    //                     volume:item.volume,
    //                     close_time: '',
    //                     turnover:parseFloat(item.quote_volume).toFixed(8)
    //                 }
    //                 lists.push(dicData);
    //             })
    //             response.success =true;
    //             response.data = {
    //                 fsym: fsym,
    //                 tsym: tsym,
    //                 ename:'bitrue',
    //                 interval: interv,
    //                 lists: lists,
    //                 rawData: res.data
    //             }
    //         }).catch(err=>{
    //             let dicData = {
    //                 code:400,
    //                 msg: 'bitrue.spot.market.getKlineHistory:unknown error'
    //             }
    //             if(err.response){
    //                 dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
    //                 dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
    //             }
    //             response.data = dicData;
    //             logger.error(`bitrue.spot.market.getKlineHistory.err: ${err}`);
    //         })
    //         logger.info(`bitrue.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
    //         return response;
    //     } catch (error) {
    //         logger.error(`bitrue.spot.market.getKlineHistory.error: ${error}`);
    //         return response;
    //     }
    // }

    /**
     * getOrderBook
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrderBook(fsym, tsym, options){
        let symbol = `${fsym}${tsym}`;
        let endpoint=`/api/v1/depth?symbol=${symbol}&limit=100`;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitrue.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data;
                let asks = [], bids = [];
                result.asks.forEach(item=>{
                    let lisa = [item[0], item[1]];
                    asks.push(lisa);
                })
                result.bids.forEach(item=>{
                    let lisb = [item[0], item[1]];
                    bids.push(lisb);
                })
                response.success =true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    asks: asks,
                    bids: bids,
                    ename:'bitrue',
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`bitrue.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.market.getOrderBook.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Market}