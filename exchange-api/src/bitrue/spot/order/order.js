const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Order{

    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        'X-MBX-APIKEY': '', //APIKey
        'Content-type': 'application/x-www-form-urlencoded', // signature
    }
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
        this.#header['X-MBX-APIKEY']=this.#apiKey;
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
        const endpoint='/api/v1/order';
        let requestBody={
            symbol:`${fsym}${tsym}`,
            side:side.toUpperCase(),
            type:type.toUpperCase(),
            quantity:options.quantity,
            timestamp: timestamp
        };
        if(type === 'limit'){
            requestBody.price = options.price;
        }
        let queryString = '';
        for(let key in requestBody){
            queryString += `${key}=${requestBody[key]}&`;
        }
        queryString = queryString.substring(0, queryString.length-1);
        let signature=createSignature(ExchangeInfo.BitRue.name,this.#secretKey,queryString, method, endpoint, timestamp);
        requestBody['signature'] = signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitrue.spot.order.createOrder.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(async res=>{
                let result = await this.getOrder(fsym, tsym, res.data.orderId);
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
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`bitrue.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.order.createOrder.error: ${error}`);
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
        const method="DELETE";
        const timestamp= Date.now();
        let endpoint='/api/v1/order';
        let symbol = `${fsym}${tsym}`;
        let queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.BitRue.name,this.#secretKey,queryString, method, endpoint, timestamp);
        let response = {
            success:false,
            data:null
        }
        try{
            endpoint = `${endpoint}?${queryString}&signature=${signature}`;
            logger.debug(`bitrue.spot.order.cancelSingle.req: ${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:this.#header
            }).then(async res=>{
                if(!res.data.code) {
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
                       code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`bitrue.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.order.cancelSingle.error: ${error}`);
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
        let endpoint=`/api/v1/order`;
        let symbol = `${fsym}${tsym}`;
        let queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.BitRue.name,this.#secretKey,queryString, method, endpoint, timestamp);
        let response = {
            success:false,
            data:null
        }
        try{
            endpoint = `${endpoint}?${queryString}&signature=${signature}`;
            logger.debug(`bitrue.spot.order.getOrder.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let result = res.data;
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename:this.#name,
                    quantity: result.origQty,
                    orderId: result.orderId,
                    executedQty: result.executedQty,
                    quoteQty: result.cummulativeQuoteQty,
                    price: result.price,
                    clientOrderId: result.clientOrderId,
                    status: result.status,
                    type: result.type.toLowerCase(),
                    side: result.side.toLowerCase(),
                    time:result.time,
                    updateTime: result.updateTime,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`bitrue.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.order.getOrder.error: ${error}`);
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
        const method="GET";
        let timestamp= Date.now();
        let symbol = `${fsym}${tsym}`;
        let endpoint=`/api/v1/allOrders`;
        let queryString = `symbol=${symbol}&timestamp=${timestamp}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    queryString+=`&startTime=${options[key]}`
                }else if(key === 'endTime'){
                    queryString+=`&endTime=${options[key]}`
                }
            }
        }
        let signature=createSignature(ExchangeInfo.BitRue.name,this.#secretKey,queryString, method, endpoint, timestamp);
        let response = {
            success:false,
            data:null
        }
        try{
            endpoint = `${endpoint}?${queryString}&signature=${signature}`
            logger.debug(`bitrue.spot.order.getOrders.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let lists= [];
                res.data.forEach(item=>{
                    let dicData = {
                        fsym:fsym,
                        tsym: tsym,
                        quantity: item.origQty,
                        orderId: item.orderId,
                        executedQty: item.executedQty,
                        quoteQty: item.cummulativeQuoteQty,
                        price: item.price,
                        clientOrderId: item.clientOrderId,
                        status: item.status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time: item.time,
                        updateTime: item.updateTime
                    }
                    lists.push(dicData)
                })
                response.success = true;
                response.data = {
                    ename:this.#name,
                    lists:lists,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`bitrue.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.order.getOrders.error: ${error}`);
            return response;
        }
    }

    /**
     * getOpenOrders
     * @param fsym
     * @param tsym
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOpenOrders(fsym, tsym, options) {
        const method="GET";
        let timestamp= Date.now();
        let symbol = `${fsym}${tsym}`;
        let endpoint=`/api/v1/openOrders`;
        let queryString = `symbol=${symbol}&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.BitRue.name,this.#secretKey,queryString, method, endpoint, timestamp);
        let response = {
            success:false,
            data:null
        }
        try{
            endpoint = `${endpoint}?${queryString}&signature=${signature}`
            logger.debug(`bitrue.spot.order.getOpenOrders.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData = {
                        fsym:fsym,
                        tsym: tsym,
                        quantity: item.origQty,
                        orderId: item.orderId,
                        executedQty: item.executedQty,
                        quoteQty: item.cummulativeQuoteQty,
                        price: item.price,
                        clientOrderId: item.clientOrderId,
                        status: item.status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time: item.time,
                        updateTime: item.updateTime
                    }
                    lists.push(dicData)
                })
                response.success = true;
                response.data = {
                    ename:this.#name,
                    lists:lists,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code ? err.response.data.code: err.response.status;
                    dicData.msg = err.response.data.msg ?err.response.data.msg: err.response.statusText
                }
                response.data = dicData;
                logger.error(`bitrue.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`bitrue.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Order}