const {axios, logger} = require('../../../utils/utils')

class Market{

    constructor(apiKey,secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
    }

    /**
     * get24hTickerStatistic
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
            let symbol = `${fsym}${tsym}`
            let endpoint = `/market/detail?symbol=${symbol.toLowerCase()}`;
            logger.debug(`huobi.spot.market.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        priceChange: '',
                        priceChangePercent: '',
                        openPrice: res.data.tick.open,
                        highPrice: res.data.tick.high,
                        lowPrice: res.data.tick.low,
                        volume: res.data.tick.vol,
                        quoteVolume: res.data.tick.amount,
                        lastPrice: res.data.tick.close,
                        rawData: res.data
                    }
                }else {
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.market.get24hTickerStatistic:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.market.get24hTickerStatistic.err: ${err}`);
            })
            logger.info(`huobi.spot.market.get24hTickerStatistic.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.market.get24hTickerStatistic.error: ${error}`);
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
            let endpoint = `/v1/settings/common/market-symbols?symbols=${symbol.toLowerCase()}`;
            logger.debug(`huobi.spot.market.getValidSymbol.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    let result = res.data.data[0];
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        minPrice: result.minov,
                        maxPrice: result.bmmaxov,
                        tickSize: result.pp,
                        minQty: result.minoa,
                        maxQty: result.maxoa,
                        stepSize: result.ap,
                        rawData: res.data
                    }
                }else {
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`huobi.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.market.getValidSymbol.error: ${error}`);
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
            let endpoint = `/v1/settings/common/market-symbols`;
            logger.debug(`huobi.spot.market.getAllSymbolInfo.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            symbol: item.symbol.toUpperCase(),
                            fsym: item.bc.toUpperCase(),
                            tsym: item.qc.toUpperCase(),
                            tickSize: item.minoa,
                            baseAssetPrecision: item.ap,
                            quoteAssetPrecision: item.pp,
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:'huobi',
                        lists: lists,
                        rawData: res.data
                    }
                }else {
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`huobi.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.market.getAllSymbolInfo.error: ${error}`);
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
        const endpoint = `/market/depth?symbol=${symbol.toLowerCase()}&type=step5`
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.spot.market.getOrderBook.url: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.status === 'ok'){
                    response.success = true;
                    response.data ={
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        asks: res.data.tick.asks,
                        bids: res.data.tick.bids,
                        rawData: res.data
                    };
                }else {
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`huobi.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.market.getOrderBook.error: ${error}`);
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
        let interv  = interval;
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
        let symbol = `${fsym}${tsym}`;
        let endpoint = `/market/history/kline?symbol=${symbol.toLowerCase()}&period=${interval}`;
        if(options){
            for(let key in options){
                if(key === 'limit'){
                    endpoint += `&size=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.spot.market.getKlineHistory.url: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`).then(res=>{
                if(res.data.status === 'ok'){
                    let lists = [];
                    res.data.data.forEach(item=>{
                        let dicData = {
                            open_time: parseInt(item.id) * 1000,
                            open: item.open,
                            high: item.high,
                            low: item.low,
                            close: item.close,
                            volume: item.amount,
                            close_time: '',
                            turnover: item.vol
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:'huobi',
                        interval: interv,
                        lists: lists.reverse(),
                        rawData: res.data
                    };
                }else {
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.market.getKlineHistory:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.market.getKlineHistory.err: ${err}`);
            })
            logger.info(`huobi.spot.market.getKlineHistory.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.market.getKlineHistory.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Market}