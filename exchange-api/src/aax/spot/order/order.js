const {axios, createSignature, ExchangeInfo, dataCalculation, logger} = require("../../../utils/utils");

class Order {

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'X-ACCESS-KEY': '', //APIKey
        'X-ACCESS-SIGN': '', // signature
        'X-ACCESS-NONCE': '', // timestamp
    }
    /**

    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(name, apiKey, secretKey, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#header['X-ACCESS-KEY'] = this.#apiKey;
    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 0:
                orderStatus = 'REJECTED';
                break;
            case 2:
                orderStatus = 'PARTIALLY_FILLED';
                break;
            case 3:
                orderStatus = 'FILLED';
                break;
            case 4:
                orderStatus = 'EXPIRED';
                break;
            case 5:
                orderStatus = 'CANCELED';
                break;
            case 6:
            case 10:
            case 11:
                orderStatus = 'EXPIRED';
                break;
            default:
                orderStatus = 'NEW';
                break;
        }
        return orderStatus;
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
        const endpoint='/v2/spot/orders';
        let requestBody={
            symbol:`${fsym}${tsym}`,
            side:side.toUpperCase(),
            orderType:type.toUpperCase(),
            orderQty:options.quantity
        };
        if(type.toLowerCase() === 'limit'){
            requestBody.price = options.price;
        }
        let signature=createSignature(ExchangeInfo.Aax.name,this.#secretKey,'', method, endpoint, timestamp, requestBody);
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.order.createOrder.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: result.base,
                        tsym: result.quote,
                        ename: this.#name,
                        quantity: result.orderQty,
                        orderId: result.orderID,
                        executedQty: result.cumQty,
                        quoteQty: dataCalculation(result.avgPrice, result.cumQty, '*'),
                        price:  result.price,
                        clientOrderId:result.clOrdID,
                        status: this.upOrderStatus(result.orderStatus),
                        type:result.orderType === 1 ? 'market' : result.orderType === 2 ? 'limit' : result.orderType,
                        side:result.side === 1 ? 'buy' : 'sell',
                        files: null,
                        rawData:res.data
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
                    msg: 'aax.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`aax.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`aax.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.order.createOrder.error: ${error}`);
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
        const endpoint=`/v2/spot/orders/cancel/${orderId}`;
        let signature=createSignature(ExchangeInfo.Aax.name,this.#secretKey,'', method, endpoint, timestamp);
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.order.cancelSingle.req: ${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: base,
                        tsym: quote,
                        ename: this.#name,
                        status:this.upOrderStatus(result.orderStatus),
                        rawData: res.data
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
                    msg: 'aax.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`aax.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`aax.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.order.cancelSingle.error: ${error}`);
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
        const endpoint=`/v2/spot/trades?orderID=${orderId}&base=${fsym.toLowerCase()}&quote=${tsym.toUpperCase()}`;
        let signature=createSignature(ExchangeInfo.Aax.name,this.#secretKey,'', method, endpoint, timestamp);
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.order.getOrder.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1) {
                    let result = res.data.data;
                    if(result.list.length > 0){
                        let item = result.list[0];
                        response.success = true;
                        response.data = {
                            fsym: item.base,
                            tsym: item.quote,
                            ename:this.#name,
                            quantity: item.orderQty,
                            orderId: item.orderID,
                            executedQty: item.filledQty,
                            quoteQty: dataCalculation(item.avgPrice , item.filledQty, '*'),
                            price: item.price,
                            clientOrderId: item.clOrdID,
                            status: this.upOrderStatus(item.orderStatus),
                            type:item.orderType === 1 ? 'market' : item.orderType === 2 ? 'limit' : item.orderType,
                            side:item.side === 1 ? 'buy' : 'sell',
                            files:null,
                            rawData:res.data
                        }
                    }else{
                        response.success = false;
                        response.data = {
                            code: res.data.code,
                            msg: 'check no data'
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
                    msg: 'aax.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`aax.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`aax.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.order.getOrder.error: ${error}`);
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
        const method="GET";
        const timestamp= Date.now();
        let endpoint=`/v2/spot/orders?base=${fsym.toLowerCase()}&quote=${tsym.toUpperCase()}`;
        if(options){
            for(let key in options){
                if(key === 'orderId'){
                    endpoint += `&orderID=${options[key]}`;
                }else if(key === 'startTime'){
                    endpoint += `&startTime=${options[key]}`;
                }else if(key === 'endTime'){
                    endpoint += `&endTime=${options[key]}`;
                }
            }
        }
        let signature=createSignature(ExchangeInfo.Aax.name,this.#secretKey,'', method, endpoint, timestamp);
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.order.getOrders.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1) {
                    let result = res.data.data.list;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            fsym:item.base,
                            tsym: item.quote,
                            orderId: item.orderID,
                            clientOrderId: item.clOrdID,
                            price: item.price,
                            quantity: item.orderQty,
                            executedQty: item.cumQty,
                            quoteQty: dataCalculation(item.avgPrice, item.cumQty, '*'),
                            status: this.upOrderStatus(item.orderStatus),
                            type:item.orderType === 1 ? 'market' : item.orderType === 2 ? 'limit' : item.orderType,
                            side:item.side === 1 ? 'buy' : 'sell',
                            time:item.createTime,
                            updateTime:item.updateTime
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists: lists,
                        rawData:res.data
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
                    msg: 'aax.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`aax.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`aax.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.order.getOrders.error: ${error}`);
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
    async getOpenOrders(fsym, tsym){
        const method="GET";
        const timestamp= Date.now();
        let endpoint=`/v2/spot/openOrders?symbol=${fsym}${tsym}`;
        let signature=createSignature(ExchangeInfo.Aax.name,this.#secretKey,'', method, endpoint, timestamp);
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.order.getOpenOrders.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1) {
                    let result = res.data.data.list;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            fsym:item.base,
                            tsym: item.quote,
                            orderId: item.orderID,
                            clientOrderId: item.clOrdID,
                            price: item.price,
                            quantity: item.orderQty,
                            executedQty: item.cumQty,
                            quoteQty: dataCalculation(item.avgPrice, item.cumQty, '*'),
                            status: this.upOrderStatus(item.orderStatus),
                            type:item.orderType === 1 ? 'market' : item.orderType === 2 ? 'limit' : item.orderType,
                            side:item.side === 1 ? 'buy' : 'sell',
                            time:item.createTime,
                            updateTime:item.updateTime
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists: lists,
                        rawData:res.data
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
                    msg: 'aax.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`aax.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`aax.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Order}