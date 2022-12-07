const {axios, createSignature, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order{

    #apiKey='';
    #secretKey='';
    #name="";
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(name, apiKey,secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
    }

    /**
     * createOrder
     * @param fsym
     * @param tsym
     * @param side
     * @param type
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async createOrder(fsym, tsym, side, type, options){
        const timestamp = Date.now().toString();
        var queryString='';
        let symbol = `${fsym}${tsym}`;
        let requestBody={
            api_key:this.#apiKey,
            qty:options.quantity,
            side:side,
            symbol:symbol,
            timestamp:timestamp,
            type:type
        }
        if(type === 'limit'){
            requestBody.price = options.price;
            requestBody.timeInForce = options.timeInForce
        }
        Object.keys(requestBody).sort().forEach(function(key) {
            queryString += key + "=" + requestBody[key] + "&";
        });
        queryString = queryString.substring(0, queryString.length - 1);
        let signature=createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);
        requestBody['sign']=signature;
        queryString+='&sign='+signature;
        logger.debug(`bybit.spot.market.buy.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint= `/spot/v1/order?${queryString}`
            logger.debug(`bybit.spot.order.createOrder.url:${endpoint}`);
            await this.axiosInstance.post(endpoint, '', {
                headers:{'Content-Type':'application/x-www-form-urlencoded'}
            }).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename:this.#name,
                        quantity: res.data.result.origQty,
                        orderId: res.data.result.orderId,
                        executedQty: res.data.result.executedQty,
                        quoteQty: '',
                        price: res.data.result.price,
                        clientOrderId: res.data.result.orderLinkId,
                        status: res.data.result.status,
                        type: type.toLowerCase(),
                        side: side.toLowerCase(),
                        files: null,
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
                    msg: 'bybit.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`bybit.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.order.createOrder.error: ${error}`);
            return response
        }
    }

    /**
     * getOrder
     * @param fsym
     * @param tsym
     * @param orderId
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrder(fsym, tsym, orderId){
        const timestamp = Date.now().toString();
        let symbol = `${fsym}${tsym}`;
        let queryString = 'api_key='+this.#apiKey
            +'&orderId='+orderId
            +'&symbol='+symbol
            +'&timestamp='+timestamp;

        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);

        queryString += '&sign='+signature;
        logger.debug(`bybit.spot.order.getOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint= `/spot/v1/order?${queryString}`
            logger.debug(`bybit.spot.order.getOrder.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: res.data.result.orderId,
                        clientOrderId: res.data.result.orderLinkId,
                        price: res.data.result.price,
                        quantity: res.data.result.origQty,
                        executedQty: res.data.result.executedQty,
                        quoteQty: res.data.result.cummulativeQuoteQty,
                        status: res.data.result.status,
                        type: res.data.result.type.toLowerCase(),
                        side: res.data.result.side.toLowerCase(),
                        time: res.data.result.time,
                        updateTime: res.data.result.updateTime,
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
                    msg: 'bybit.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`bybit.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.order.getOrder.error: ${error}`);
            return response
        }
    }

    /**
     * getOrders
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrders(fsym, tsym, options){
        const timestamp = Date.now().toString();
        let symbol = `${fsym}${tsym}`;
        let queryString = 'api_key='+this.#apiKey
            +'&symbol='+symbol
            +'&timestamp='+timestamp;
        if(options){
            for(let key in options){
                if(options[key]){
                    queryString += `&${key}=${options[key]}`;
                }
            }
        }
        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);

        queryString += '&sign='+signature;
        logger.debug(`bybit.spot.order.getOrders.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint= `/spot/v1/history-orders?${queryString}`
            logger.debug(`bybit.spot.order.getOrders.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    let lists = [];
                    res.data.result.forEach(item=>{
                        let dicData= {
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.orderId,
                            clientOrderId:item.orderLinkId,
                            price: item.price,
                            quantity: item.origQty,
                            executedQty: item.executedQty,
                            quoteQty: item.cummulativeQuoteQty,
                            status: item.status,
                            type: item.type.toLowerCase(),
                            side: item.side.toLowerCase(),
                            time: item.time,
                            updateTime: item.updateTime
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:this.#name,
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
                    msg: 'bybit.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`bybit.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.order.getOrders.error: ${error}`);
            return response
        }
    }

    /**
     * cancelSingle
     * @param fsym
     * @param tsym
     * @param orderId
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async cancelSingle(fsym, tsym, orderId){
        const timestamp = Date.now().toString();
        let symbol = `${fsym}${tsym}`;
        let queryString = 'api_key='+this.#apiKey
            +'&orderId='+orderId
            +'&symbolId='+symbol
            +'&timestamp='+timestamp;

        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);
        queryString += '&sign='+signature;
        logger.debug(`bybit.spot.order.cancelSingle.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint= `/spot/v1/order/fast?${queryString}`
            logger.debug(`bybit.spot.order.cancelSingle.url:${endpoint}`);
            await this.axiosInstance.delete(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: res.data.result.orderId,
                        status: res.data.result.status,
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
                    msg: 'bybit.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`bybit.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.order.cancelSingle.error: ${error}`);
            return response
        }
    }

    /**
     * getOpenOrders
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOpenOrders(fsym, tsym){
        const timestamp = Date.now().toString();
        let symbol = `${fsym}${tsym}`;
        let queryString = 'api_key='+this.#apiKey
            +'&symbol='+symbol
            +'&timestamp='+timestamp;
        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);

        queryString += '&sign='+signature;
        logger.debug(`bybit.spot.order.getOpenOrders.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint= `/spot/v1/open-orders?${queryString}`
            logger.debug(`bybit.spot.order.getOpenOrders.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    let lists = [];
                    res.data.result.forEach(item=>{
                    let dicData={
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.orderId,
                        clientOrderId: item.orderLinkId,
                        price: item.price,
                        quantity: item.origQty,
                        executedQty: item.executedQty,
                        quoteQty: item.cummulativeQuoteQty,
                        status: item.status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time: item.time,
                        updateTime: item.updateTime
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename:this.#name,
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
                    msg: 'bybit.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`bybit.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.order.getOpenOrders.error: ${error}`);
            return response
        }
    }
}
module.exports = {Order}
