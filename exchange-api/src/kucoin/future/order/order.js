const {axios, createSignature, ExchangeInfo, logger, getUuid} = require("../../../utils/utils");

class Order {

    #apiKey = '';
    #secretKey = '';
    #passphrase = '';
    #name='';
    #header = {
        'KC-API-SIGN': '',
        'KC-API-TIMESTAMP': '',
        'KC-API-KEY': '',
        'KC-API-PASSPHRASE': '',
        'KC-API-VERSION': '2'
    }

    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, passphrase, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.#header['KC-API-KEY'] = this.#apiKey;
        this.#header['KC-API-PASSPHRASE'] = this.#passphrase;
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
    async createOrder(fsym, tsym, side, type, options) {
        const method = 'POST';
        const timestamp = Date.now().toString();
        const clientOid = getUuid();
        let symbol = `${fsym}${tsym}`;
        let market = tsym === 'USDT' ? `${symbol}M` : symbol;
        if(!options.leverage){
            options.leverage = 1
        }
        let requestBody = {
            clientOid: clientOid,
            side: side,
            type: type,
            symbol: market,
            size: options.quantity,
            leverage: options.leverage
        };
        if(type === 'limit'){
            requestBody.price = options.price;
            requestBody.timeInForce = options.timeInForce;
        }
        const endpoint = '/api/v1/orders';
        const signature = createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp,
            requestBody);
        this.#header['KC-API-SIGN'] = signature;
        this.#header['KC-API-TIMESTAMP'] = timestamp;
        this.#header['Content-Type'] = 'application/json; charset=utf-8';
        let response = {
            success: false,
            data: null
        }
        try {
            logger.debug(`kucoin.future.order.createOrder.url: ${endpoint}, params:${requestBody}`);
            await this.axiosInstance.post(endpoint, requestBody, {
                headers: this.#header
            }).then( async res => {
                if(res.data.code === '200000'){
                    let resData = res.data;
                    let orderId = res.data.data.orderId;
                    let result = await this.getOrder(fsym, tsym, orderId);
                    resData.data.detail = result.data;
                    if(result.success){
                        response.success = true;
                        response.data = {
                            fsym:fsym,
                            tsym: tsym,
                            ename: this.#name,
                            quantity: result.data.quantity,
                            orderId: result.data.orderId,
                            executedQty: result.data.executedQty,
                            quoteQty: result.data.quoteQty,
                            price: result.data.price,
                            clientOrderId: result.data.clientOrderId,
                            status: result.data.status,
                            type: result.data.type,
                            side: result.data.side,
                            files: null,
                            rawData: resData
                        }
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err => {
                let dicData = {
                    code: 400,
                    msg: 'kucoin.future.order.createOrder:unknown error'
                }
                if (err.response) {
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.order.createOrder.err: ${err}`);
            })
            logger.info(`kucoin.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.order.createOrder.error: ${error}`);
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
        const method = "DELETE";
        const timestamp=Date.now().toString();
        const endpoint = `/api/v1/orders/${orderId}`;
        const signature = createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.future.order.cancelSingle.url: ${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data ={
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: orderId,
                        status: '',
                        rawData: res.data.data
                    }
                    if(res.data.data.cancelledOrderIds){
                        let item = res.data.data.cancelledOrderIds;
                        if(item[0] === orderId){
                            response.data.status = 'EXPIRED';
                        }
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`kucoin.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.order.cancelSingle.error: ${error}`);
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
        const method = 'GET'
        const timestamp=Date.now().toString();
        const endpoint = `/api/v1/orders/${orderId}`;
        const signature=createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.future.order.getOrder.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    let status = 'NEW';
                    if(res.data.data.status === 'done' && res.data.data.filledSize === res.data.data.size ){
                        status = 'FILLED';
                    }else if(res.data.data.status === 'done' && parseFloat(res.data.data.filledSize) === 0){
                        status = 'CANCELED';
                    }else if(res.data.data.status === 'done' && parseFloat(res.data.data.filledSize) > 0){
                        status = 'EXPIRED';
                    }else{
                        status = 'NEW';
                    }
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId:res.data.data.orderId,
                        clientOrderId: res.data.data.clientOid,
                        price: res.data.data.price,
                        quantity: res.data.data.size,
                        executedQty: res.data.data.filledSize,
                        quoteQty: res.data.data.filledValue,
                        status: status,
                        type: res.data.data.type,
                        side: res.data.data.side,
                        time: res.data.data.createdAt,
                        updateTime: res.data.data.updatedAt,
                        rawData: res.data
                }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.order.getOrder.err: ${err}`);
            })
            logger.info(`kucoin.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.order.getOrder.error: ${error}`);
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
        const method = 'GET'
        const timestamp=Date.now().toString();
        let symbol = `${fsym}${tsym}`;
        let market = tsym === 'USDT' ? `${symbol}M` : symbol;
        let endpoint = `/api/v1/orders?symbol=${market}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint += `&startAt=${options[key]}`;
                }
                if(key === 'endTime'){
                    endpoint += `&endAt=${options[key]}`;
                }
            }
        }
        const signature=createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`kucoin.future.order.getOrders.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code === '200000'){
                    let lists = [];
                    res.data.data.items.forEach(item=>{
                        let status = 'NEW';
                        if(item.status === 'done' && item.filledSize === item.size ){
                            status = 'FILLED';
                        }else if(item.status === 'done' && parseFloat(item.filledSize) === 0){
                            status = 'CANCELED';
                        }else if(item.status === 'done' && parseFloat(item.filledSize) > 0){
                            status = 'EXPIRED';
                        }else{
                            status = 'NEW';
                        }
                        let dicData={
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.id,
                            clientOrderId:item.clientOid,
                            price: item.price,
                            quantity: item.size,
                            executedQty:item.filledSize,
                            quoteQty: item.filledValue,
                            status: status,
                            type: item.type,
                            side: item.side,
                            time: item.createdAt,
                            updateTime: item.updatedAt
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.order.getOrders.err: ${err}`);
            })
            logger.info(`kucoin.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.order.getOrders.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Order}