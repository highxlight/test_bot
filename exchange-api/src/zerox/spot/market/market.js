const {axios, logger} = require("../../../utils/utils");


class Market {

    constructor(endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
    }

    /**
     * getAllSymbolInfo
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getValidSymbol(symbol){
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint = `/swap/v1/tokens`;
            logger.debug(`zerox.spot.market.getValidSymbol.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                let rescords = res.data.records;
                rescords.forEach(item=>{
                    if(item.symbol === symbol.toUpperCase()){
                        response.data = item;
                        return;
                    }
                })
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'zerox.spot.market.getValidSymbol:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`zerox.spot.market.getValidSymbol.err: ${err}`);
            })
            logger.info(`zerox.spot.market.getValidSymbol.response: ${JSON.stringify(response)}`)
            return response;
        }catch (e){
            logger.error(`tzerox.spot.market.getValidSymbol.error: ${e}`);
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
        };
        try {
            let endpoint = `/swap/v1/tokens`;
            logger.debug(`zerox.spot.market.getAllSymbolInfo.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data = res.data
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'zerox.spot.market.getAllSymbolInfo:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`zerox.spot.market.getAllSymbolInfo.err: ${err}`);
            })
            logger.info(`zerox.spot.market.getAllSymbolInfo.response: ${JSON.stringify(response)}`)
            return response;
        }catch (e){
            logger.error(`tzerox.spot.market.getAllSymbolInfo.error: ${e}`);
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
        };
        try {
            let endpoint = `/swap/v1/price?sellToken=${fsym}&buyToken=${tsym}&sellAmount=10`;
            logger.debug(`zerox.spot.market.getMarketPrice.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data = res.data
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'zerox.spot.market.getMarketPrice:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.reason;
                }
                response.data = dicData;
                logger.error(`zerox.spot.market.getMarketPrice.err: ${err}`);
            })
            logger.info(`zerox.spot.market.getMarketPrice.response: ${JSON.stringify(response)}`)
            return response;
        }catch (e){
            logger.error(`tzerox.spot.market.getMarketPrice.error: ${e}`);
            return response;
        }
    }

    /**
     * getOrderBook
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrderBook(fsym, tsym){
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint = `/orderbook/v1?quoteToken=${fsym}&baseToken=${tsym}`;
            logger.debug(`zerox.spot.market.getOrderBook.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                response.success = true;
                response.data = res.data
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'zerox.spot.market.getOrderBook:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.reason;
                }
                response.data = dicData;
                logger.error(`zerox.spot.market.getOrderBook.err: ${err}`);
            })
            logger.info(`zerox.spot.market.getOrderBook.response: ${JSON.stringify(response)}`)
            return response;
        }catch (e){
            logger.error(`tzerox.spot.market.getOrderBook.error: ${e}`);
            return response;
        }
    }

}
module.exports = {Market};