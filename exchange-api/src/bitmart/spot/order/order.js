const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Order{

    #apiKey='';
    #secretKey='';
    #passphrase='';
    #name = '';
    #header={
        'X-BM-KEY': '', //APIKey
        'X-BM-SIGN': '', // signature
        'X-BM-TIMESTAMP': '', // timestamp
        'Content-Type': 'application/json'
    }
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(name, apiKey,secretKey, passphrase, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#passphrase=passphrase
        this.#header['X-BM-KEY']=this.#apiKey;
    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 1:
                orderStatus = 'REJECTED';
                break;
            case 3:
                orderStatus = 'REJECTED';
                break;
            case 5:
                orderStatus = 'PARTIALLY_FILLED';
                break;
            case 6:
                orderStatus = 'FILLED';
                break;
            case 7:
                orderStatus = 'PENDING_CANCEL';
                break;
            case 8:
                orderStatus = 'CANCELED';
                break;
            default:
                orderStatus = 'NEW';
                break;
        }
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
        const method="POST";
        const timestamp= Date.now();
        const endpoint='/spot/v1/submit_order';
        let requestBody={
            symbol:`${fsym}_${tsym}`,
            side:side,
            type:type,
            size:options.quantity
        };
        if(type === 'limit'){
            requestBody.price = options.price;
        }
        let queryString = `${timestamp}#${this.#passphrase}#${JSON.stringify(requestBody)}`;
        let signature=createSignature(ExchangeInfo.BitMart.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['X-BM-SIGN']=signature;
        this.#header['X-BM-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.order.createOrder.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(async res=>{
                if(res.data.code === 1000) {
                    let result = await this.getOrder(fsym, tsym, res.data.data.order_id);
                    if (result.success) {
                        response.success = true;
                        response.data = {
                            fsym:fsym,
                            tsym: tsym,
                            ename:this.#name,
                            quantity: result.data.quantity,
                            orderId: result.data.orderId,
                            executedQty: result.data.executedQty,
                            quoteQty:result.data.quoteQty,
                            price:  result.data.price,
                            clientOrderId:result.data.clientOrderId,
                            status:result.data.status,
                            type:result.data.type,
                            side:result.data.side,
                            files: null,
                            rawData:result.data
                        }
                    }else{
                        response.success = false;
                        response.data = {
                            code: result.data.code,
                            msg:  result.data.msg
                        }
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`bitmart.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.order.createOrder.error: ${error}`);
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
        const method="POST";
        const timestamp= Date.now();
        const endpoint='/spot/v2/cancel_order';
        let requestBody={
            order_id:`${orderId}`
        };
        let queryString = `${timestamp}#${this.#passphrase}#${JSON.stringify(requestBody)}`;
        let signature=createSignature(ExchangeInfo.BitMart.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['X-BM-SIGN']=signature;
        this.#header['X-BM-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.order.cancelSingle.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(async res=>{
                if(res.data.data.result) {
                    let result = await this.getOrder(fsym, tsym, orderId);
                    if (result.success) {
                        response.success = true;
                        response.data = {
                            fsym: fsym,
                            tsym: tsym,
                            ename:this.#name,
                            status: result.data.status,
                            rawData: result.data
                        }
                    }else{
                        response.success = false;
                        response.data = {
                           code: result.data.code,
                            msg:  result.data.msg
                        }
                    }
                }else{
                    response.success = false;
                    response.data = {
                       code: 400,
                        msg:'failed to cancel order'
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`bitmart.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.order.cancelSingle.error: ${error}`);
            return response;
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
        const method="GET";
        const timestamp= Date.now();
        const endpoint=`/spot/v1/order_detail?order_id=${orderId}`;
        let requestBody={
            order_id:`${orderId}`
        };
        let queryString = `${timestamp}#${this.#passphrase}#${JSON.stringify(requestBody)}`;
        let signature=createSignature(ExchangeInfo.BitMart.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['X-BM-SIGN']=signature;
        this.#header['X-BM-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.order.getOrder.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        quantity: result.size,
                        orderId: result.order_id,
                        executedQty: result.filled_size,
                        quoteQty: result.filled_notional,
                        price: result.price,
                        clientOrderId: '',
                        status: this.upOrderStatus(result.status),
                        type: result.type,
                        side: result.side,
                        time:result.create_time,
                        updateTime:'',
                        rawData:res.data
                    }
                }else {
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`bitmart.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.order.getOrder.error: ${error}`);
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
    async getOrders(fsym, tsym, options) {
        const method="POST";
        const timestamp= Date.now();
        let symbol = `${fsym}_${tsym}`;
        const endpoint=`/spot/v1/trades?symbol=${symbol}&limit=100&offset=1`;
        let requestBody={
            symbol:symbol,
            limit: 100,
            offset: 1,
        };
        let queryString = `${timestamp}#${this.#passphrase}#${JSON.stringify(requestBody)}`;
        let signature=createSignature(ExchangeInfo.BitMart.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['X-BM-SIGN']=signature;
        this.#header['X-BM-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.order.getOrders.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1000){
                    let result = res.data.data;
                    let lists = [];
                    result.trades.forEach(item=>{
                        let dicData = {
                            fsym:fsym,
                            tsym: tsym,
                            quantity: item.size,
                            orderId: item.order_id,
                            executedQty: item.size,
                            quoteQty: item.notional,
                            price: item.price_avg,
                            clientOrderId: '',
                            status: 'FILLED',
                            type: item.type,
                            side: item.side,
                            time: item.create_time,
                            updateTime:''
                        }
                        lists.push(dicData)
                    })
                    response.success = true;
                    response.data = {
                        ename:this.#name,
                        lists:lists,
                        rawData:res.data
                    }
                }else {
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmart.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`bitmart.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.order.getOrders.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Order}