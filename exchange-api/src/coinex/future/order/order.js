const {axios, createSignature, ExchangeInfo, dataCalculation, logger} = require("../../../utils/utils");

class Order {

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        "Authorization":"",
        "AccessId": "",
    }
    /**

     /**
     *
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
        this.#header['AccessId'] = apiKey
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
        let response = {
            success:false,
            data:null
        }
        let leverage = 3;
        if(!options.leverage || parseInt(options.leverage) < 1){
            leverage = 3
        }else if(parseInt(options.leverage) > 100){
            leverage = 100
        }else{
            leverage = parseInt( options.leverage);
        }
        let result = await this.changeLeverage(fsym, tsym,leverage);
        if(!result.success){
            response.success = false;
            response.data = result.data;
            return  response;
        }
        const method="future";
        const timestamp= Date.now();
        const endpoint=`/order/put_${type.toLowerCase()}`;
        let symbol = `${fsym}${tsym}`;
        let sid = side === 'sell' ? 1 : 2;
        let queryString = `market=${symbol}&side=${sid}&amount=${options.quantity}`
        if(type.toLowerCase() === 'limit'){
            queryString += `&price=${options.price}`;
        }
        queryString += `&timestamp=${timestamp}`
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['Authorization']=signature;
        try{
            logger.debug(`coinex.future.order.createOrder.req: ${endpoint}, params:${JSON.stringify(queryString)}`);
            await this.axiosInstance.post(endpoint, queryString,{
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
                        orderId: result.order_id,
                        executedQty: dataCalculation(result.amount, result.left, '-') ,
                        quoteQty: result.deal_stock,
                        price:  result.price,
                        clientOrderId:result.client_id,
                        status: null,
                        type:result.type === 1 ? 'limit' : result.type === 2 ? 'market': result.type,
                        side:result.side === 1 ? 'sell' : result.side === 2 ? 'buy': result.side,
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
                    msg: 'coinex.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.future.order.createOrder.err: ${err}`);
            })
            logger.info(`coinex.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.order.createOrder.error: ${error}`);
            return response;
        }
    }

    /**
     *
     * @param fsym
     * @param tsym
     * @param leverage
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async changeLeverage(fsym, tsym,leverage){
        const method="future";
        const timestamp= Date.now();
        const endpoint=`/market/adjust_leverage`;
        let symbol = `${fsym}${tsym}`;
        let queryString = `market=${symbol}&leverage=${leverage}&position_type=2&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['Authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.order.changeLeverage.req: ${endpoint}, params:${JSON.stringify(queryString)}`);
            await this.axiosInstance.post(endpoint, queryString,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = result
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
                    msg: 'coinex.future.order.changeLeverage:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.future.order.changeLeverage.err: ${err}`);
            })
            logger.info(`coinex.future.order.changeLeverage.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.order.changeLeverage.error: ${error}`);
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
        const method="future";
        const timestamp= Date.now();
        const endpoint=`/order/cancel`;
        let symbol = `${fsym}${tsym}`;
        let queryString =`market=${symbol}&order_id=${orderId}&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.order.cancelSingle.req: ${endpoint}`);
            await this.axiosInstance.post(endpoint, queryString,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        status:null,
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
                    msg: 'coinex.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`coinex.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.order.cancelSingle.error: ${error}`);
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
        const method="future";
        const timestamp= Date.now();
        const endpoint=`/order/status`;
        let symbol = `${fsym}${tsym}`;
        let queryString = `market=${symbol}&order_id=${orderId}&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['Authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.order.getOrder.req: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0 && res.data.data) {
                    let result = res.data.data;
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        quantity: result.amount,
                        orderId: result.order_id,
                        executedQty:dataCalculation(result.amount, result.left, '-') ,
                        quoteQty: result.deal_stock,
                        price:  result.price,
                        clientOrderId:result.client_id,
                        status: this.upOrderStatus(result.status),
                        type:result.type === 1 ? 'limit' : result.type === 2 ? 'market': result.type,
                        side:result.side === 1 ? 'sell' : result.side === 2 ? 'buy': result.side,
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
                    msg: 'coinex.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.future.order.getOrder.err: ${err}`);
            })
            logger.info(`coinex.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.order.getOrder.error: ${error}`);
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
        const method="future";
        const timestamp= Date.now();
        let endpoint=`/order/pending`;
        let symbol = `${fsym}${tsym}`;
        let queryString=`market=${symbol}&side=0&offset=0&limit=100&timestamp=${timestamp}`;
        let signature=createSignature(ExchangeInfo.CoinEx.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['Authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.future.order.getOpenOrders.req: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0) {
                    let result = res.data.data.records;
                    let lists = [];
                    result.forEach(item=>{
                        let dicData = {
                            fsym: fsym,
                            tsym: tsym,
                            quantity: item.amount,
                            orderId: item.order_id,
                            executedQty: dataCalculation(result.amount, item.left, '-') ,
                            quoteQty: item.deal_stock,
                            price:  item.price,
                            clientOrderId:item.client_id,
                            status: this.upOrderStatus(item.status),
                            type:item.type === 1 ? 'limit' : item.type === 2 ? 'market': item.type,
                            side:item.side === 1 ? 'sell' : item.side === 2 ? 'buy': item.side,
                            time:item.create_time,
                            updateTime:item.update_time
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
                    msg: 'coinex.future.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`coinex.future.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`coinex.future.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.future.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }

}

module.exports = {Order}