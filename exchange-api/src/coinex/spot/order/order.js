const {axios, createSignature, ExchangeInfo, dataCalculation, logger} = require("../../../utils/utils");

class Order {

    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
        "post": {"Content-Type": "application/json"},
        "authorization":""
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
    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 'not_deal':
                orderStatus = 'REJECTED';
                break;
            case 'part_deal':
                orderStatus = 'PARTIALLY_FILLED';
                break;
            case 'done':
                orderStatus = 'FILLED';
                break;
            case 'cancel':
                orderStatus = 'CANCELED';
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
        const endpoint=`/order/${type.toLowerCase()}`;
        let symbol = `${fsym}${tsym}`;
        let requestBody={
            access_id:this.#apiKey,
            market: symbol.toUpperCase(),
            type: side.toLowerCase(),
            amount:options.quantity,
            tonce: timestamp,
        };
        if(type.toLowerCase() === 'limit'){
            requestBody.price = options.price;
        }
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,'', method, endpoint, timestamp, requestBody);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.order.createOrder.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        quantity: result.amount,
                        orderId: result.id,
                        executedQty: result.deal_amount,
                        quoteQty: result.deal_money,
                        price:  result.price,
                        clientOrderId:result.client_id,
                        status: this.upOrderStatus(result.status),
                        type:result.order_type,
                        side:result.type,
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
                    msg: 'coinex.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`coinex.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.order.createOrder.error: ${error}`);
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
        const endpoint=`/order/pending`;
        let requstBody = {
            access_id: this.#apiKey,
            id: orderId,
            market: `${fsym}${tsym}`,
            tonce: timestamp
        }
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,'', method, endpoint, timestamp, requstBody);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.order.cancelSingle.req: ${endpoint}`);
            await this.axiosInstance.delete(endpoint,{
                headers:this.#header
            }, requstBody).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        status:this.upOrderStatus(result.status),
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
                    msg: 'coinex.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`coinex.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.order.cancelSingle.error: ${error}`);
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
        const endpoint=`/order/status`;
        let requstBody = {
            access_id: this.#apiKey,
            id: orderId,
            market: `${fsym}${tsym}`,
            tonce: timestamp
        }
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,'', method, endpoint, timestamp, requstBody);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.order.getOrder.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        quantity: result.amount,
                        orderId: result.id,
                        executedQty: result.deal_amount,
                        quoteQty: result.deal_money,
                        price: result.price,
                        clientOrderId: result.client_id,
                        status: this.upOrderStatus(result.status),
                        type:result.order_type,
                        side:result.type,
                        files:null,
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
                    msg: 'coinex.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`coinex.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.order.getOrder.error: ${error}`);
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
        let endpoint=`/order/finished`;
        let requestBody = {
            access_id: this.#apiKey,
            market: `${fsym}${tsym}`,
            start_time: options.startTime,
            end_time: options.end_time,
            page: options.page,
            limit: 100,
            tonce: timestamp,
        }
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,'', method, endpoint, timestamp, requestBody);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.order.getOrders.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }, requestBody).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data.list;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.id,
                            clientOrderId: item.client_id,
                            price: item.price,
                            quantity: item.orderQty,
                            executedQty: item.deal_amount,
                            quoteQty:item.deal_money,
                            status: this.upOrderStatus(item.status),
                            type:item.order_type,
                            side:item.type,
                            time:item.create_time,
                            updateTime:item.finished_time
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
                    msg: 'coinex.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`coinex.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.order.getOrders.error: ${error}`);
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
        let endpoint=`/order/pending`;
        let requestBody={
            access_id: this.#apiKey,
            market: `${fsym}${tsym}`,
            page: 1,
            limit: 100,
            tonce: timestamp
        }
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,'', method, endpoint, timestamp, requestBody);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.order.getOpenOrders.req: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }, requestBody).then(res=>{
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
                    msg: 'coinex.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`coinex.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Order}