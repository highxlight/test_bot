const {axios, createSignature, ExchangeInfo, dataCalculation, randString, logger} = require("../../../utils/utils");


class Order{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'Authorization':'',
        'Content-Type': 'application/json'
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
    }

    updateStatusData(status){
        let orderStatus = 'NEW';
        switch (status){
            case 'open':
                orderStatus = 'NEW';
                break;
            case 'filled':
                orderStatus = 'FILLED';
                break;
            case 'rejected':
                orderStatus = 'REJECTED';
                break;
            case 'cancelled':
                orderStatus = 'CANCELED';
                break;
            case 'untriggered':
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
    async createOrder(fsym, tsym, side, type,options){
        const method="GET"
        const timestamp=Date.now();
        let symbol = `${fsym}-${tsym}`;
        let endpoint=`/api/v2/private/${side.toLowerCase()}?amount=${options.quantity}&instrument_name=${symbol}&type=${type}`;
        if(type.toLowerCase() === 'limit'){
            endpoint+=`&price=${options.price}`;
        }
        const nonce=randString(6);
        const signature=createSignature(ExchangeInfo.Deribit.name,
            this.#secretKey,
            nonce,
            method,
            endpoint,
            timestamp);
        this.#header['Authorization']=`deri-hmac-sha256 id=${this.#apiKey},ts=${timestamp},sig=${signature},nonce=${nonce}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`deribit.future.order.createOrder:url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                let item = res.data.result.order;
                let status = this.updateStatusData(item.order_state);
                response.success = true;
                response.data = {
                    sym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    quantity: item.amount,
                    orderId: item.order_id,
                    executedQty: item.filled_amount,
                    quoteQty: dataCalculation(item.average_price, item.filled_amount, '*'),
                    price: item.price,
                    clientOrderId:item.label,
                    status: status,
                    type: item.order_type,
                    side: item.direction,
                    files: null,
                    rawData:res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.order.createOrder.err: ${err}`);
            })
            logger.info(`deribit.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.order.createOrder.error: ${error}`);
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
        const method="GET"
        const timestamp=Date.now();
        const endpoint=`/api/v2/private/cancel?order_id=${orderId}`;
        const nonce=randString(6);
        const signature=createSignature(ExchangeInfo.Deribit.name,
            this.#secretKey,
            nonce,
            method,
            endpoint,
            timestamp);
        this.#header['Authorization']=`deri-hmac-sha256 id=${this.#apiKey},ts=${timestamp},sig=${signature},nonce=${nonce}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`deribit.future.order.cancelSingle:url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                response.success =true;
                response.data = {
                    fsym: fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.result.order_id,
                    status: this.updateStatusData(res.data.result.order_state),
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`deribit.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.order.cancelSingle.error: ${error}`);
            return response;
        }
    }

    /**
     * getOrder
     * @param fysm
     * @param tsym
     * @param orderId
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrder(fysm, tsym, orderId){
        const method="GET"
        const timestamp=Date.now();
        const endpoint=`/api/v2/private/get_order_state?order_id=${orderId}`;
        const nonce=randString(6);
        const signature=createSignature(ExchangeInfo.Deribit.name,
            this.#secretKey,
            nonce,
            method,
            endpoint,
            timestamp);
        this.#header['Authorization']=`deri-hmac-sha256 id=${this.#apiKey},ts=${timestamp},sig=${signature},nonce=${nonce}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`deribit.future.order.getOrder:url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                let item = res.data.result;
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: item.order_id,
                    clientOrderId: item.label,
                    price: item.price,
                    quantity: item.amount,
                    executedQty:item.filled_amount,
                    quoteQty: dataCalculation(item.average_price, item.filled_amount, '*'),
                    status: this.updateStatusData(item.order_state),
                    type: item.order_type,
                    side: item.direction,
                    time: item.creation_timestamp,
                    updateTime: item.last_update_timestamp,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.order.getOrder.err: ${err}`);
            })
            logger.info(`deribit.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.order.getOrder.error: ${error}`);
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
        const method="GET"
        const timestamp=Date.now();
        let symbol = `${fsym}-${tsym}`;
        const endpoint=`/api/v2/private/get_order_history_by_instrument?instrument_name=${symbol}`;
        const nonce=randString(6);
        const signature=createSignature(ExchangeInfo.Deribit.name,
            this.#secretKey,
            nonce,
            method,
            endpoint,
            timestamp);
        this.#header['Authorization']=`deri-hmac-sha256 id=${this.#apiKey},ts=${timestamp},sig=${signature},nonce=${nonce}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`deribit.future.order.getOrders:url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                let result = res.data.result;
                let lists = [];
                result.forEach(item=>{
                    let dicData = {
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.order_id,
                        clientOrderId:item.label,
                        price:item.price,
                        quantity:item.amount,
                        executedQty: item.filled_amount,
                        quoteQty: dataCalculation(item.average_price, item.filled_amount, '*'),
                        status: this.updateStatusData(item.order_state),
                        type: item.order_type,
                        side: item.direction,
                        time: item.creation_timestamp,
                        updateTime: item.last_update_timestamp
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data = {
                    ename: this.#name,
                    lists:lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.order.getOrders.err: ${err}`);
            })
            logger.info(`deribit.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.order.getOrders.error: ${error}`);
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
    async getOpenOrders(fsym, tsym, options){
        const method="GET"
        const timestamp=Date.now();
        let symbol = `${fsym}-${tsym}`;
        const endpoint=`/api/v2/private/get_open_orders_by_instrument?instrument_name=${symbol}`;
        const nonce=randString(6);
        const signature=createSignature(ExchangeInfo.Deribit.name,
            this.#secretKey,
            nonce,
            method,
            endpoint,
            timestamp);
        this.#header['Authorization']=`deri-hmac-sha256 id=${this.#apiKey},ts=${timestamp},sig=${signature},nonce=${nonce}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`deribit.future.order.getOpenOrders:url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                let result = res.data.result;
                let lists = [];
                result.forEach(item=>{
                    let dicData = {
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.order_id,
                        clientOrderId: item.label,
                        price: item.price,
                        quantity: item.amount,
                        executedQty: item.filled_amount,
                        quoteQty: dataCalculation(item.average_price, item.filled_amount, '*'),
                        status: this.updateStatusData(item.order_state),
                        type: item.order_type,
                        side: item.direction,
                        time: item.creation_timestamp,
                        updateTime: item.last_update_timestamp
                    }
                    lists.push(dicData);
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
                    msg: 'deribit.future.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`deribit.future.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Order}