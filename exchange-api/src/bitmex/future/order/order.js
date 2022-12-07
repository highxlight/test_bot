const {axios, createSignature, ExchangeInfo, dataCalculation, timeFormat} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order{

    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        'api-expires': '',
        'api-key': '',
        'api-signature': ''
    };
    /**
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
        this.#header['api-key']=this.#apiKey
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
        let symbol = `${fsym}${tsym}`;
        const method="POST"
        const timestamp=Date.now();
        let endpoint=`/api/v1/order`;
        let queryBody={
            symbol:symbol,
            ordType: type.toLowerCase() ==='market'? 'Market':'Limit',
            side: side.toLowerCase() ==='buy'? 'Buy':'Sell',
            orderQty:options.quantity
        }
        if(type.toLowerCase() === 'limit'){
            queryBody.price = options.price
        }
        const signature=createSignature(ExchangeInfo.BitMex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp, queryBody);
        this.#header['api-expires']=timestamp;
        this.#header['api-signature']=signature;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.limit.buy.url:${endpoint}, params:${JSON.stringify(queryBody)}`);
            await this.axiosInstance.post(endpoint,queryBody,{
                headers:this.#header
            }).then(res=>{
                response.success = true;
                response.data ={
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    quantity: res.data.orderQty,
                    orderId: res.data.orderID,
                    executedQty: res.data.cumQty,
                    quoteQty: dataCalculation(res.data.cumQty, res.data.avgPx, '*'),
                    price: res.data.price,
                    clientOrderId:'',
                    status: res.data.ordStatus.toUpperCase(),
                    type: res.data.ordType.toLowerCase(),
                    side: res.data.side.toLowerCase(),
                    files:null,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.limit.buy:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.limit.buy.err: ${err}`);
            })
            logger.info(`bitmex.future.limit.buy.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.limit.buy.error: ${error}`);
            return response;
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
        logger.debug(`bitmex.future.order.cancelSingle.req:${orderId}`);
        const method="DELETE"
        const timestamp=Date.now();
        const endpoint=`/api/v1/order?orderID=${orderId}`;
        const signature=createSignature(ExchangeInfo.BitMex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['api-expires']=timestamp;
        this.#header['api-signature']=signature;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.order.cancelSingle.url:${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:this.#header
            }).then(res=>{
                let data = null;
                response.success = true;
                if(res.data.length > 0){
                    if('error' in res.data[0]){
                        response.success = false;
                        response.data = {
                            code: res.data[0].orderID,
                            msg: res.data[0].error
                        }
                    }else{
                        data = {
                            fsym: fsym,
                            tsym: tsym,
                            ename: this.#name,
                            orderId: res.data[0].orderID,
                            status: res.data[0].ordStatus.toUpperCase(),
                            rawData: res.data
                        }
                        response.data =data
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`bitmex.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.order.cancelSingle.error: ${error}`);
            return response;
        }
    }

    /**
     *  getOrder
     * @returns {Promise<*>}
     */
    async getOrder(fsym, tsym, orderId){
        let symbol = `${fsym}${tsym}`;
        logger.debug(`bitmex.future.order.getOrder.req:${symbol}, ${orderId}`);
        const method="GET"
        const timestamp=Date.now();
        let filter =JSON.stringify({orderID: orderId});
        const endpoint=`/api/v1/order?symbol=${symbol}&filter=${encodeURIComponent(filter)}`;
        const signature=createSignature(ExchangeInfo.BitMex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['api-expires']=timestamp;
        this.#header['api-signature']=signature;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.order.getOrder.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let data = null;
                if(res.data.length > 0){
                    let item = res.data[0];
                    data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        quantity: item.orderQty,
                        orderId: item.orderID,
                        executedQty: item.cumQty,
                        quoteQty: dataCalculation(item.cumQty, item.avgPx, '*'),
                        price: item.price,
                        clientOrderId:'',
                        status: item.ordStatus.toUpperCase(),
                        type: item.ordType.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time:timeFormat(item.transactTime),
                        updateTime:timeFormat(item.timestamp),
                        rawData:res.data
                    }
                }
                response.success = true;
                response.data =data;
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.order.getOrder.err: ${err}`);
            })
            logger.info(`bitmex.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.order.getOrder.error: ${error}`);
            return response;
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
        let symbol = `${fsym}${tsym}`;
        const method="GET"
        const timestamp=Date.now();
        const endpoint=`/api/v1/order?symbol=${symbol}`;
        const signature=createSignature(ExchangeInfo.BitMex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['api-expires']=timestamp;
        this.#header['api-signature']=signature;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.order.getOrders.url:${endpoint}`)
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData = {
                        fsym:fsym,
                        tsym: tsym,
                        quantity: item.orderQty,
                        orderId: item.orderID,
                        executedQty: item.cumQty,
                        quoteQty: dataCalculation(item.cumQty, item.avgPx, '*'),
                        price: item.price,
                        clientOrderId:'',
                        status: item.ordStatus.toUpperCase(),
                        type: item.ordType.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time:timeFormat(item.transactTime),
                        updateTime:timeFormat(item.timestamp)
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    ename: this.#name,
                    lists: lists,
                    rawData: res.data
                };
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.order.getOrders.err: ${err}`);
            })
            logger.info(`bitmex.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.order.getOrders.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Order}
