const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Order{

    #apiKey='';
    #secretKey='';
    #SignatureMethod = 'HmacSHA256';
    #SignatureVersion = 2;
    #name='';
    #baseUrl='';
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
        this.#baseUrl = endpoint;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
    }

    async getAccountId(){
        const method='GET';
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        let queryString = 'AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);
        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            '/v1/account/accounts',
            '',
            '',
            this.#baseUrl);

        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try{
            let endpoint =`/v1/account/accounts?${queryString}`;
            logger.debug(`huobi.spot.market.getAccountId.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    res.data.data.forEach(item=>{
                        if(item.type.toLowerCase() === 'spot'){
                            response.success = true;
                            response.data = item
                        }
                    })
                }else{
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.market.getAccountId:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.market.getAccountId.err: ${err}`);
            })
            logger.info(`huobi.spot.market.getAccountId.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.market.getAccountId.error: ${error}`);
            return response;
        }
    }

    updateStauts(status){
        let order_status = 'NEW';
        switch (status) {
            case 'created':
                order_status = 'NEW';
                break;
            case 'submitted':
                order_status = 'NEW';
                break;
            case 'partial-filled':
                order_status = 'PARTIALLY_FILLED';
                break;
            case 'filled':
                order_status = 'FILLED';
                break;
            case 'partial-canceled':
                order_status = 'EXPIRED';
                break;
            case 'canceling':
                order_status = 'PENDING_CANCEL';
                break;
            case 'canceled':
                order_status = 'CANCELED';
                break;
        }
        return order_status;
    }

    /**
     *
     * @param fsym
     * @param tsym
     * @param side
     * @param type
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async createOrder(fsym, tsym, side, type, options){
        let result = await this.getAccountId();
        let response = {
            success:false,
            data:null
        }
        if(!result.success){
            response.data = result.data;
            return response
        }
        let item = result.data;
        const accountId = item.type==='spot' ? item.id : '';
        const method='POST';
        const endpoint='/v1/order/orders/place';
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        let queryString='AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);
        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            '',
            '',
            this.#baseUrl);
        queryString += '&Signature=' + encodeURIComponent(signature);
        let symbol = `${fsym}${tsym}`;
        let requestBody={
            'account-id': accountId.toString(),
            symbol:`${symbol.toLowerCase()}`,
            type:`${side.toLowerCase()}-${type.toLowerCase()}`,
            amount:options.quantity,
            Signature:encodeURIComponent(signature)
        }
        if(type.toLowerCase() === 'limit'){
            requestBody.price = options.price;
        }
        try{
            logger.debug(`huobi.spot.order.createOrder.url: ${endpoint}?${queryString}, params: ${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, requestBody).then(async res=>{
                if(res.data.status === 'ok'){
                    let orderId = res.data.data;
                    let result = await this.getOrder(fsym, tsym, orderId);
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
                            files:null,
                            rawData:res.data
                        }
                    }else{
                        response.data = result.data
                    }
                }else{
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`huobi.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.order.createOrder.error: ${error}`);
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
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        let symbol = `${fsym}${tsym}`;
        let queryString = 'AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp)
            +'&states=filled'
            +'&symbol='+symbol.toLowerCase();
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    queryString += `&start-time=${options[key]}`;
                }
                if(key === 'endTime'){
                    queryString += `&end-time=${options[key]}`;
                }
                if(key === 'limit'){
                    queryString += `&size=${options[key]}`;
                }
            }
        }
        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            '/v1/order/orders',
            '',
            '',
            this.#baseUrl);

        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try {
            let endpoint =`/v1/order/orders?${queryString}`;
            logger.debug(`huobi.spot.order.getOrders.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok'){
                    let lists = [];
                    res.data.data.forEach(item => {
                        let status = this.updateStauts(item.status);
                        let orderType = item.type.split('-');
                        let dicData = {
                            sym:fsym,
                            tsym: tsym,
                            orderId: item.id,
                            clientOrderId: item['client-order-id'],
                            price: item.price,
                            quantity: item.amount,
                            executedQty: item['field-amount'],
                            quoteQty: item['field-cash-amount'],
                            status: status,
                            type: orderType[1],
                            side: orderType[0],
                            time: item['created-at'],
                            updateTime: item['finished-at'],
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
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`huobi.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.order.getOrders.error: ${error}`);
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
        const method = 'GET';
        const endpoint = `/v1/order/orders/${orderId}`
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        var queryString = 'AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);

        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            '',
            '',
            this.#baseUrl);

        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.spot.order.getOrder.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                if(res.data.status === 'ok'){
                    let result = res.data.data;
                    let status = this.updateStauts(result.status);
                    let orderType = result.type.split('-');
                    response.success = true;
                    response.data ={
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: result.id,
                        clientOrderId: result['client-order-id'],
                        price: result.price,
                        quantity: result.amount,
                        executedQty: result['field-amount'],
                        quoteQty: result['field-cash-amount'],
                        status: status,
                        type: orderType[1],
                        side: orderType[0],
                        time: result['created-at'],
                        updateTime: result['finished-at'],
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`huobi.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.order.getOrder.error: ${error}`);
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
    async cancelSingle(fsym, tsym,orderId){
        const method = 'POST';
        const endpoint = `/v1/order/orders/${orderId}/submitcancal`
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        var queryString = 'AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);

        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            '',
            '',
            this.#baseUrl);

        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.spot.order.cancelSingle.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(async res=>{
                if(res.data.status === 'ok'){
                    let orderId = res.data.data;
                    let result = await this.getOrder(fsym, tsym, orderId);
                    if(result.success){
                        response.success = true;
                        response.data ={
                            fsym: fsym,
                            tsym: tsym,
                            ename: this.#name,
                            orderId: result.data.orderId,
                            status: result.data.status,
                            rawData: res.data
                        };
                    }else{
                        response.data = result.data;
                    }
                }else{
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`huobi.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.order.cancelSingle.error: ${error}`);
            return response;
        }
    }

    /**
     * getOpenOrders
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOpenOrders(fsym, tsym){
        const method = 'GET';
        let symbol = `${fsym}${tsym}`;
        const endpoint = `/v1/order/openOrders?symbol=${symbol.toLowerCase()}`
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        let queryString = 'AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);

        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            '',
            '',
            this.#baseUrl);

        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.spot.order.getOpenOrders.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`).then(res=>{
                if(res.data.status === 'ok'){
                    let lists = [];
                    res.data.data.forEach(item => {
                        let status = this.updateStauts(item.status);
                        let orderType = item.type.split('-');
                        let dicData = {
                            sym:fsym,
                            tsym: tsym,
                            orderId: item.id,
                            clientOrderId: item['client-order-id'],
                            price: item.price,
                            quantity: item.amount,
                            executedQty: item['field-amount'],
                            quoteQty: item['field-cash-amount'],
                            status: status,
                            type: orderType[1],
                            side: orderType[0],
                            time: item['created-at'],
                            updateTime: item['finished-at'],
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
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`huobi.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Order}