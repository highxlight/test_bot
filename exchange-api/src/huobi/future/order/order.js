const {axios, createSignature, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order{

    #apiKey='';
    #secretKey='';
    #SignatureMethod = 'HmacSHA256';
    #SignatureVersion = 2;
    #name='';
    #baseUrl = '';
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
    updateStatus(status){
        let order_status = 'NEW';
        switch (status) {
            case 3:
                order_status =  'NEW';
                break;
            case 4:
                order_status =  'PARTIALLY_FILLED';
                break;
            case 5:
                order_status =  'EXPIRED';
                break;
            case 6:
                order_status =  'FILLED';
                break;
            case 7:
                order_status =  'CANCELED';
                break;
            case 11:
                order_status =  'PENDING_CANCEL';
                break;
            default:
                order_status = 'REJECTED';
                break
        }
        return order_status;
    }
    /***
     * createOrder
     * @param fsym
     * @param tsym
     * @param side
     * @param type
     * @param options
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async createOrder(fsym, tsym, side, type, options){
        const method='POST';
        const endpoint='/linear-swap-api/v1/swap_cross_order';
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
        if(!options.leverage){
            options.leverage = 1
        }
        let requestBody={
            'contract_code':`${fsym}-${tsym}`,
            'volume':options.quantity,
            'direction':side,
            'offset':'open',
            'lever_rate':options.leverage,
            'order_price_type':type,
            'Signature':signature
        }
        if(type.toLowerCase() === 'limit'){
            requestBody.price = options.price
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`huobi.future.order.createOrder.url: ${endpoint}?${queryString}, params: ${requestBody}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, requestBody).then( async res=>{
                if(res.data.status === 'ok'){
                    let orderId = res.data.data.order_id;
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
                            quoteQty:result.data.quoteQty,
                            price: result.data.price,
                            clientOrderId: result.data.clientOrderId,
                            status: result.data.status,
                            type: result.data.type,
                            side:result.data.side,
                            files:null,
                            rawData: res.data
                        }
                    }else{
                        response.data = result.data;
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.order.createOrder.err: ${err}`);
            })
            logger.info(`huobi.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.order.createOrder.error: ${error}`);
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
        const method='POST';
        const endpoint='/linear-swap-api/v1/swap_cross_hisorders';
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
        let requestBody={
            'contract_code':`${fsym}-${tsym}`,
            'trade_type':0,
            'type':1,
            'status': 0,
            'Signature':signature
        }
        if(options){
            for(let key in options){
                if(key === 'startTime'){
                    queryString += `&start_time=${options[key]}`;
                }
                if(key === 'endTime'){
                    queryString += `&end_time=${options[key]}`;
                }
                if(key === 'limit'){
                    queryString += `&size=${options[key]}`;
                }
            }
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`huobi.future.order.getOrders.url: ${endpoint}?${queryString}, params: ${requestBody}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, requestBody).then(res=>{
                if(res.data.status === 'ok'){
                    let result = res.data.data.orders;
                    let lists = [];
                    result.forEach(item=>{
                        let status = this.updateStatus(item.status);
                        let dicData={
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.order_id,
                            clientOrderId: '',
                            price: item.price,
                            quantity: item.volume,
                            executedQty:item.trade_volume,
                            quoteQty: item.trade_turnover,
                            status: status,
                            type: item.order_price_type === 1 ? 'limit':'market',
                            side: item.direction,
                            time: item.create_date,
                            updateTime:item.update_time
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
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.order.getOrders.err: ${err}`);
            })
            logger.info(`huobi.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.order.getOrders.error: ${error}`);
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
        const method = 'POST';
        const endpoint = `/linear-swap-api/v1/swap_cross_order_detail`
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
        let queryBody={
            'contract_code': `${fsym}-${tsym}`,
            'order_id':orderId,
            'Signature':signature
        }
        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.future.order.getOrder.url: ${endpoint}?${queryString}, params: ${JSON.stringify(queryBody)}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, queryBody).then(res=>{
                if(res.data.status === 'ok'){
                    let result = res.data.data;
                    let status = this.updateStatus(result.status);
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: result.order_id,
                        clientOrderId: result.client_order_id,
                        price: result.price,
                        quantity: result.volume,
                        executedQty: result.trade_volume,
                        quoteQty: result.trade_turnover,
                        status: status,
                        type: result.type === 'limit' ? 'limit' : 'market',
                        side: result.direction,
                        time: result.created_at,
                        updateTime: '',
                        rawData: result
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.order.getOrder.err: ${err}`);
            })
            logger.info(`huobi.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.order.getOrder.error: ${error}`);
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
        const method = 'POST';
        const endpoint = `/linear-swap-api/v1/swap_cross_cancel`
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
        let queryBody={
            'contract_code':`${fsym}-${tsym}`,
            'order_id':orderId,
            'Signature':signature
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.future.order.cancelSingle.url: ${endpoint}?${queryString}, params: ${JSON.stringify(queryBody)}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, queryBody).then(async res=>{
                if(res.data.status === 'ok'){
                    if(res.data.data.successes){
                        let result = await this.getOrder(fsym, tsym ,orderId);
                        if(result.success){
                            response.success = true;
                            response.data = {
                                fsym: fsym,
                                tsym: tsym,
                                ename: this.#name,
                                orderId: result.data.orderId,
                                status: result.data.status,
                                rawData: res.data
                            }
                        }else {
                            response.data = result.data
                        }
                    }else{
                        response.data = {
                            code: res.data.data.errors[0].err_code,
                            msg: res.data.data.errors[0].err_msg,
                        }
                    }

                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`huobi.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.order.cancelSingle.error: ${error}`);
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
        const method = 'POST';
        const endpoint = `/linear-swap-api/v1/swap_cross_openorders`
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
        let queryBody={
            'contract_code':`${fsym}-${tsym}`
        }
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`huobi.future.order.getOpenOrders.url: ${endpoint}?${queryString}, params: ${JSON.stringify(queryBody)}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, queryBody).then(res=>{
                if(res.data.status === 'ok'){
                    let result = res.data.data.orders;
                    let lists = [];
                    result.forEach(item=>{
                        let status = this.updateStatus(item.status);
                        let dicData={
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.order_id,
                            clientOrderId: item.client_order_id,
                            price: item.price,
                            quantity: item.volume,
                            executedQty:item.trade_volume,
                            quoteQty: item.trade_turnover,
                            status: status,
                            type: item.order_price_type === 1 ? 'limit':'market',
                            side: item.direction,
                            time: item.created_at,
                            updateTime:item.update_time
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
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`huobi.future.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Order}