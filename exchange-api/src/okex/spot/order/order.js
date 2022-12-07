const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Order{

    #apiKey='';
    #secretKey='';
    #passphrase='';
    #name = '';
    #header={
        'OK-ACCESS-KEY': '', //APIKey
        'OK-ACCESS-SIGN': '', // signature
        'OK-ACCESS-TIMESTAMP': '', // timestamp
        'OK-ACCESS-PASSPHRASE': '', //You specified when you created the API key
    }
    /**
     *
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
        this.#header['OK-ACCESS-KEY']=this.#apiKey;
        this.#header['OK-ACCESS-PASSPHRASE']=this.#passphrase;

    }
    updateStatus(stauts){
        let order_status = 'NEW';
        switch (stauts){
            case 'live':
                order_status = 'NEW';
                break;
            case 'canceled':
                order_status = 'CANCELED';
                break;
            case 'partially_filled':
                order_status = 'PARTIALLY_FILLED';
                break;
            case 'filled':
                order_status = 'FILLED';
                break;
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
        const method="POST";
        const timestamp=new Date().toISOString();
        const endpoint='/api/v5/trade/order';
        let requestBody={
            clOrdId:Date.now().toString()+'TF',
            instId:`${fsym}-${tsym}`,
            tdMode:'isolated',
            side:side,
            ordType:type,
            sz:options.quantity
        };
        if(type === 'limit'){
            requestBody.px = options.price;
        }
        let queryString='';
        queryString = JSON.stringify(requestBody);
        let signature=createSignature(ExchangeInfo.Okex.name,this.#secretKey,queryString, method, endpoint, timestamp);
        this.#header['OK-ACCESS-SIGN']=signature;
        this.#header['OK-ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.order.createOrder.req: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(async res=>{
                if(res.data.code === '0'){
                    let  orderId = res.data.data.ordId;
                    let result = await this.getOrder(fsym, tsym, orderId);
                    if(result.success){
                        response.success = true;
                        response.data = {
                            fsym:fsym,
                            tsym: tsym,
                            ename:this.#name,
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
                        response.success = false;
                        response.data = result.data
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
                    msg: 'okex.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`okex.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.order.createOrder.error: ${error}`);
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
        const timestamp=new Date().toISOString();
        const endpoint=`/api/v5/trade/cancel-order`;
        const requestBody={
            'instId':`${fsym}-${tsym}`,
            'ordId':orderId
        }
        let queryString=JSON.stringify(requestBody);
        const signature=createSignature(ExchangeInfo.Okex.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            timestamp);
        this.#header['OK-ACCESS-SIGN']=signature;
        this.#header['OK-ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.order.cancelSingle.url: ${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint,requestBody,{
                headers:this.#header
            }).then(async res=>{
                if(res.data.code === '0'){
                    let  orderId = res.data.data.ordId;
                    let result = await this.getOrder(fsym, tsym, orderId);
                    if(result.success){
                        response.success = true;
                        response.data = {
                            fsym:fsym,
                            tsym: tsym,
                            ename:this.#name,
                            orderId: result.data.orderId,
                            rawData:res.data
                        }
                    }else{
                        response.success = false;
                        response.data = result.data
                    }
                }else{
                    response.success = false;
                    response.data={
                        code:res.data.code,
                        msg: res.data.msg
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`okex.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.order.cancelSingle.error: ${error}`);
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
        const timestamp=new Date().toISOString();
        let symbol = `${fsym}-${tsym}`;
        const endpoint=`/api/v5/trade/order?ordId=${orderId}&instId=${symbol}`;
        const signature=createSignature(ExchangeInfo.Okex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['OK-ACCESS-SIGN']=signature;
        this.#header['OK-ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.order.getOrder.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data;
                    let status = this.updateStatus(result.state);
                    response.success =true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename:this.#name,
                        orderId: result.ordId,
                        clientOrderId: result.clOrdId,
                        price: result.px,
                        quantity: result.sz,
                        executedQty: result.accFillSz,
                        quoteQty: '',
                        status: status,
                        type: result.ordType,
                        side: res.side,
                        time: result.cTime,
                        updateTime: result.uTime,
                        rawData: res.data
                    }
                }else {
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`okex.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.order.getOrder.error: ${error}`);
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
        let instType="SPOT";
        const method="GET";
        const timestamp=new Date().toISOString();
        let symbol = `${fsym}-${tsym}`;
        const endpoint=`/api/v5/trade/orders-history-archive?instType=${instType}&instId=${symbol}`;
        const signature=createSignature(ExchangeInfo.Okex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['OK-ACCESS-SIGN']=signature;
        this.#header['OK-ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.order.getOrders.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let status = this.updateStatus(item.state);
                        let dicData = {
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.ordId,
                            clientOrderId: item.clOrdId,
                            price: item.px,
                            quantity: item.sz,
                            executedQty: item.accFillSz,
                            quoteQty:'',
                            status: status,
                            type: item.ordType,
                            side: item.side,
                            time: item.cTime,
                            updateTime:item.uTime
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        ename:this.#name,
                        lists: lists,
                        rawData: res.data
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
                    msg: 'okex.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`okex.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.order.getOrders.error: ${error}`);
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
        const method="GET";
        const timestamp=new Date().toISOString();
        let symbol = `${fsym}-${tsym}`;
        const endpoint=`/api/v5/trade/orders-pending?instId=${symbol}`;
        const signature=createSignature(ExchangeInfo.Okex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['OK-ACCESS-SIGN']=signature;
        this.#header['OK-ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.order.getOpenOrders.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === '0'){
                    let result = res.data.data;
                    let lists = [];
                    result.forEach(item=>{
                        let status = this.updateStatus(item.state);
                        let dicData = {
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.ordId,
                            clientOrderId: item.clOrdId,
                            price: item.px,
                            quantity: item.sz,
                            executedQty: item.accFillSz,
                            quoteQty:'',
                            status: status,
                            type: item.ordType,
                            side: item.side,
                            time: item.cTime,
                            updateTime:item.uTime
                        }
                        lists.push(dicData);
                    })
                    response.success =true;
                    response.data = {
                        ename:this.#name,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data= {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`okex.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.order.getOpenOrders.error: ${error}`);
            return response;
        }

    }
}
module.exports = {Order}