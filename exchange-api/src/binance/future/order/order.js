const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Order{

    #apiKey='';
    #secretKey='';
    #name = '';
    /**
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
        let response = {
            success:false,
            data:null
        };
        let leverage = 1;
        if(!options.leverage || parseInt(options.leverage) < 1){
            leverage = 1
        }else if(parseInt(options.leverage) > 125){
            leverage = 125
        }else{
            leverage = parseInt( options.leverage);
        }
        let result = await this.changeLeverage(fsym, tsym,leverage);
        if(!result.success){
            response.success = false;
            response.data = result.data;
            return  response;
        }
        const timestamp=Date.now();
        const method='GET';
        const endpoint='/fapi/v1/order';
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
        logger.debug(`binance.future.order.createOrder.req:${queryString}`);
        try{
            logger.debug(`binance.future.order.createOrder.url:${endpoint}?${queryString}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`,'',{
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    quantity: res.data.origQty,
                    orderId: res.data.orderId,
                    executedQty: res.data.executedQty,
                    quoteQty:res.data.cumQuote,
                    price:  res.data.price,
                    clientOrderId:res.data.clientOrderId,
                    status:res.data.status,
                    type:res.data.type.toLowerCase(),
                    side:res.data.side.toLowerCase(),
                    rawData:res.data
            }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.order.createOrder.err: ${err}`);
            })
            logger.info(`binance.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.order.createOrder.error: ${error}`);
            return response;
        }
    }

    /**
     * changeLeverage
     * @param fsym
     * @param tsym
     * @param leverage
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async changeLeverage(fsym, tsym, leverage){
        const timestamp=Date.now();
        const method='GET';
        const endpoint='/fapi/v1/leverage';
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol.toUpperCase()}&leverage=${leverage}&timestamp=${timestamp}`;
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        queryString+=`&signature=${signature}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`binance.future.order.changeLeverage.url:${endpoint}?${queryString}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`,'',{
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data =  res.data
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.order.changeLeverage:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.order.changeLeverage.err: ${err}`);
            })
            logger.info(`binance.future.order.changeLeverage.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.order.changeLeverage.error: ${error}`);
            return response;
        }
    }

    /**
     * getOrder
     * @param fsym
     * @param tsym
     * @param orderId
     * @param clientOrderId
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrder(fsym, tsym, orderId, clientOrderId){
        const timestamp = Date.now();
        const method = 'GET'
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol.toUpperCase()}&origClientOrderId=${clientOrderId}&timestamp=${timestamp.toString()}`;
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);
        queryString+=`&signature=${signature}`;
        logger.debug(`binance.future.order.getOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint =`/fapi/v1/order?${queryString}`;
            logger.debug(`binance.future.order.getOrder.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.orderId,
                    clientOrderId:res.data.clientOrderId,
                    price:res.data.price,
                    quantity:res.data.origQty,
                    executedQty:res.data.executedQty,
                    quoteQty:res.data.cumQuote,
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
                    msg: 'binance.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.order.getOrder.err: ${err}`);
            })
            logger.info(`binance.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.order.getOrder.error: ${error}`);
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
        logger.debug(`binance.future.order.getOrders.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint =`/fapi/v1/allOrders?${queryString}`;
            logger.debug(`binance.future.order.getOrders.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData = {
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.orderId,
                        clientOrderId: item.clientOrderId,
                        price: item.price,
                        quantity: item.origQty,
                        executedQty:item.executedQty,
                        quoteQty:item.cumQuote,
                        status: item.status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time:item.time,
                        updateTime:item.updateTime
                    }
                    lists.push(dicData)
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
                    msg: 'binance.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.order.getOrders.err: ${err}`);
            })
            logger.info(`binance.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.order.getOrders.error: ${error}`);
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
        logger.debug(`binance.future.order.getOpenOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/fapi/v1/openOrders?${queryString}`;
            logger.debug(`binance.future.order.getOpenOrder.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let dicData={
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.orderId,
                        clientOrderId: item.clientOrderId,
                        price:item.price,
                        quantity:item.origQty,
                        executedQty:item.executedQty,
                        quoteQty:item.cumQuote,
                        status: item.status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time: item.time,
                        updateTime:item.updateTime
                    }
                    lists.push(dicData)
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
                    msg: 'binance.future.order.getOpenOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.order.getOpenOrder.err: ${err}`);
            })
            logger.info(`binance.future.order.getOpenOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.order.getOpenOrder.error: ${error}`);
            return response;
        }
    }

    /**
     * cancelSingle
     * @param fsym
     * @param tsym
     * @param orderId
     * @param clientOrderId
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async cancelSingle(fsym, tsym, orderId, clientOrderId){
        const timestamp=Date.now();
        const method = "DELETE";
        let symbol = `${fsym}${tsym}`;
        let queryString=`symbol=${symbol.toUpperCase()}&origClientOrderId=${clientOrderId}&timestamp=${timestamp}`;
        const signature=createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);
        queryString+=`&signature=${signature}`;
        logger.debug(`binance.future.order.cancelSingle.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/fapi/v1/order?${queryString}`;
            logger.debug(`binance.future.order.cancelSingle.url:${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:{'X-MBX-APIKEY':this.#apiKey}
            }).then(res=>{
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.orderId,
                    status: res.data.status,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'binance.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`binance.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`binance.future.order.cancelSingle.error: ${error}`);
            return response;
        }
    }
}

module.exports = {Order}
