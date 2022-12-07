const {axios, createSignature, timeFormat, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order{

    #apiKey = '';
    #secretKey = '';
    #name = '';
    #header={
        'FTX-KEY':'',
        'FTX-SIGN':'',
        'FTX-TS':''
    };
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
        this.#header['FTX-KEY']=this.#apiKey;
    }
    updateStatus(status, remainingSize, quantity){
        let order_status = 'NEW';
        let size = parseFloat(remainingSize);
        if(status === 'open'){
            order_status = 'PARTIALLY_FILLED';
        }else  if(status === 'closed' && size === 0){
            order_status = 'FILLED';
        }else if(status === 'closed' && size < quantity){
            order_status = 'EXPIRED';
        } else{
            order_status = 'NEW';
        }
        return order_status;
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
        let leverage = 1
        if(options.leverage){
            if(options.leverage < 1) {
                leverage = 1
            }else if(options.leverage > 101){
                leverage = 101
            }
        }
        let resultObj = await this.changeLeverage(leverage);
        if(!resultObj.success){
            return  resultObj
        }
        const timestmap=Date.now().toString();
        const endpoint=`/api/orders`;
        if(tsym === 'USDT'){
            tsym = 'USD';
        }
        let requestBody= {
            market:`${fsym}-${tsym}`,
            side:side,
            size:options.quantity,
            type:type,
        }
        if(type.toLowerCase() === 'limit'){
            requestBody.price = options.price;
        }
        const signature=createSignature(ExchangeInfo.Ftx.name,
            this.#secretKey,
            '',
            'POST',
            endpoint,
            timestmap,
            requestBody);
        this.#header['FTX-TS']=timestmap;
        this.#header['FTX-SIGN']=signature;
        this.#header['Content-Type']='application/json';
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`ftx.future.order.createOrder.url: ${endpoint},  params: ${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint, requestBody,{
                headers:this.#header
            }).then(res=>{
                if(res.data.success){
                    let result = res.data.result;
                    let status = this.updateStatus(result.status, result.remainingSize, result.size);
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        quantity: result.size,
                        orderId: result.id,
                        executedQty: result.filledSize,
                        quoteQty: '',
                        price: result.price,
                        clientOrderId: result.clientId,
                        status: status,
                        type: result.type.toLowerCase(),
                        side: result.side.toLowerCase(),
                        files:null,
                        rawData:res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.order.createOrder.err: ${err}`);
            })
            logger.info(`ftx.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.order.createOrder.error: ${error}`);
            return response;
        }
    }

    async changeLeverage(leverage){
        const timestmap=Date.now().toString();
        const endpoint=`/api/account/leverage`;
        let requestBody= {
            leverage: leverage
        }
        const signature=createSignature(ExchangeInfo.Ftx.name,
            this.#secretKey,
            '',
            'POST',
            endpoint,
            timestmap,
            requestBody);
        this.#header['FTX-TS']=timestmap;
        this.#header['FTX-SIGN']=signature;
        this.#header['Content-Type']='application/json';
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`ftx.future.order.changeLeverage.url: ${endpoint},  params: ${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint, requestBody,{
                headers:this.#header
            }).then(res=>{
                if(res.data.success){
                    response.success = true;
                    response.data = res.data.data;
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.order.changeLeverage:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.order.changeLeverage.err: ${err}`);
            })
            logger.info(`ftx.future.order.changeLeverage.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.order.changeLeverage.error: ${error}`);
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
    async cancelSingle (fsym, tsym, orderId){
        const method = 'DELETE';
        const timestamp = Date.now().toString();
        const endpoint = `/api/orders/${orderId}`;
        const signature = createSignature(ExchangeInfo.Ftx.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);

        this.#header['FTX-SIGN']=signature;
        this.#header['FTX-TS']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`ftx.future.order.cancelSingle.url: ${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:this.#header
            }).then(async res=>{
                if(res.data.success){
                    let result = await this.getOrder(fsym, tsym, orderId);
                    let status = this.updateStatus(result.status, result.remainingSize, result.size);
                    if(result.success){
                        response.success = true;
                        response.data = {
                            fsym: fsym,
                            tsym: tsym,
                            ename: this.#name,
                            orderId: orderId,
                            status: status,
                            rawData: res.data
                        }
                    }else{
                        response = result;
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.result
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`ftx.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.order.cancelSingle.error: ${error}`);
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
        const timestamp = Date.now().toString();
        const endpoint = `/api/orders/${orderId}`
        const signature = createSignature(ExchangeInfo.Ftx.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);

        this.#header['FTX-SIGN']=signature;
        this.#header['FTX-TS']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`ftx.future.order.cancelSingle.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.success){
                    let result = res.data.result;
                    let status = this.updateStatus(result.status, result.remainingSize, result.size);
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: result.id,
                        clientOrderId:rresult.clientId,
                        price: result.price,
                        quantity: result.size,
                        executedQty: result.filledSize,
                        quoteQty: '',
                        status: status,
                        remainingSize: result.remainingSize,
                        type: result.type.toLowerCase(),
                        side: result.side.toLowerCase(),
                        time: timeFormat(result.createdAt),
                        updateTime:'',
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.result
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.order.getOrder.err: ${err}`);
            })
            logger.info(`ftx.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.order.getOrder.error: ${error}`);
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
        const method = 'GET';
        const timestamp = Date.now().toString();
        let symbol = `${fsym}-${tsym}`;
        let endpoint = `/api/orders/history?market=${symbol}`;
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    endpoint += `&start_time=${options[key]}`;
                }
                if(key === 'endTime'){
                    endpoint += `&end_time=${options[key]}`;
                }
            }
        }
        const signature = createSignature(ExchangeInfo.Ftx.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);

        this.#header['FTX-SIGN']=signature;
        this.#header['FTX-TS']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`ftx.future.order.getOrders.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.success){
                    let lists = [];
                    res.data.result.forEach(item=>{
                        let status = this.updateStatus(item.status,item.remainingSize, item.size);
                        let dicData = {
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.id,
                            clientOrderId:item.clientId,
                            price: item.price,
                            quantity: item.size,
                            executedQty: item.filledSize,
                            quoteQty: '',
                            status: status,
                            type: item.type.toLowerCase(),
                            side: item.side.toLowerCase(),
                            time: timeFormat(item.createdAt),
                            updateTime:'',
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists:lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.future.order.getOrders.err: ${err}`);
            })
            logger.info(`ftx.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.future.order.getOrders.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Order}
