const {axios, createSignature, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order{

    #apiKey='';
    #secretKey='';
    #name = '';
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint,timeout: timeout});
        this.#name = name
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
        const timestamp=Date.now();
        const method='GET';
        const endpoint='/api/v3/order';
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol.toUpperCase()}&side=${side.toUpperCase()}&type=${type.toUpperCase()}&timestamp=${timestamp}`;
        if(type.toLowerCase() === 'market'){
            queryString+= `&quantity=${options.quantity}`;
        }else{
            if(options){
                for(let key in options){
                    if(options[key]){
                        queryString += `&${key}=${options[key]}`;
                    }
                }
            }
        }
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        queryString+=`&signature=${signature}`;
        logger.debug(`binance.spot.order.createOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`binance.spot.order.createOrder.url:${endpoint}?${queryString}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`,'',{
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    ename: this.#name,
                    fsym:fsym,
                    tsym: tsym,
                    quantity: res.data.origQty,
                    orderId: res.data.orderId,
                    executedQty:res.data.executedQty,
                    quoteQty: res.data.cummulativeQuoteQty,
                    price:  res.data.price,
                    clientOrderId:res.data.clientOrderId,
                    status:res.data.status,
                    type:res.data.type.toLowerCase(),
                    side:res.data.side.toLowerCase(),
                    fills:res.data.fills,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`binance.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.spot.order.createOrder.error: ${error}`);
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
        const timestamp=Date.now();
        const method = "DELETE"
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol.toUpperCase()}&orderId=${orderId}&timestamp=${timestamp}`;
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);
        queryString+=`&signature=${signature}`;
        logger.debug(`binance.spot.order.cancelSingle.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v3/order?${queryString}`;
            logger.debug(`binance.spot.order.cancelSingle.url:${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    rawData: res.data,
                    fsym: fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.orderId,
                    status: res.data.status
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`binance.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.spot.order.cancelSingle.error: ${error}`);
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
        const timestamp=Date.now();
        const method = 'GET'
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol.toUpperCase()}&orderId=${orderId}&timestamp=${timestamp.toString()}`;
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);
        queryString+=`&signature=${signature}`;
        logger.debug(`binance.spot.order.getOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v3/order?${queryString}`;
            logger.debug(`binance.spot.order.getOrder.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.orderId,
                    clientOrderId: res.data.clientOrderId,
                    price:res.data.price,
                    quantity: res.data.origQty,
                    executedQty: res.data.executedQty,
                    quoteQty: res.data.cummulativeQuoteQty,
                    status: res.data.status,
                    type:res.data.type.toLowerCase(),
                    side: res.data.side.toLowerCase(),
                    time:res.data.time,
                    updateTime:res.data.updateTime,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`binance.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.spot.order.getOrder.error: ${error}`);
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
        const timestamp=Date.now();
        const method = 'GET'
        let symbol = `${fsym}${tsym}`;
        let queryString='symbol='+symbol.toUpperCase()+'&timestamp='+timestamp.toString();
        if(options){
            for(let key in options){
                if(options[key]){
                    queryString += `&${key}=${options[key]}`;
                }
            }
        }
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);

        queryString+=`&signature=${signature}`;
        logger.debug(`binance.spot.order.getOrders.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v3/allOrders?${queryString}`;
            logger.debug(`binance.spot.order.getOrders.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    ename: this.#name,
                    lists:[],
                    rawData: res.data
                }
                res.data.forEach(item=>{
                    let ditData = {
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.orderId,
                        clientOrderId: item.clientOrderId,
                        price:item.price,
                        quantity: item.origQty,
                        executedQty: item.executedQty,
                        quoteQty: item.cummulativeQuoteQty,
                        status: item.status,
                        type:item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time:item.time,
                        updateTime:item.updateTime,
                    }
                    response.data.lists.push(ditData)
                })
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`binance.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.spot.order.getOrders.error: ${error}`);
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
        const timestamp=Date.now();
        const method = 'GET'
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol}&timestamp=${timestamp.toString()}`;
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);

        queryString+=`&signature=${signature}`;
        logger.debug(`binance.spot.order.getOpenOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/api/v3/openOrders?${queryString}`;
            logger.debug(`binance.spot.order.getOpenOrder.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    ename: this.#name,
                    lists:[],
                    rawData: res.data
                }
                res.data.forEach(item=>{
                    let ditData = {
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.orderId,
                        clientOrderId: item.clientOrderId,
                        price:item.price,
                        quantity: item.origQty,
                        executedQty: item.executedQty,
                        quoteQty: item.cummulativeQuoteQty,
                        status: item.status,
                        type:item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time:item.time,
                        updateTime:item.updateTime,
                    }
                    response.data.lists.push(ditData)
                })
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.spot.order.getOpenOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.order.getOpenOrder.err: ${err}`);
            })
            logger.info(`binance.spot.order.getOpenOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.spot.order.getOpenOrder.error: ${error}`);
            return  response;
        }
    }
}

module.exports = {Order}
