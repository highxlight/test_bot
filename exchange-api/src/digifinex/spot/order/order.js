const {axios, createSignature, ExchangeInfo, dataCalculation} = require("../../../utils/utils");
const logger = require('../../../utils/logger');
const errorCode = require('../errorCode')

class Order {


    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'ACCESS-KEY': '', //APIKey
        'ACCESS-SIGN': '', // signature
        'ACCESS-TIMESTAMP': '',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }

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
    constructor(name, apiKey, secretKey, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#header['ACCESS-KEY']=this.#apiKey;
    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 0:
                orderStatus='NEW';
                break;
            case 1:
                orderStatus='PARTIALLY_FILLED';
                break;
            case 2:
                orderStatus='FILLED';
                break;
            case 3:
                orderStatus='CANCELED';
                break;
            case 4:
                orderStatus='EXPIRED';
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
        };
        const timestamp= Math.floor(Date.now() / 1000);
        const method='POST';
        let symbol = `${fsym}_${tsym}`;
        let endpoint = '/spot/order/new'
        if(type.toLowerCase() === 'market'){
            side = `${side}_${type}`;
        }
        let queryString=`symbol=${symbol.toLowerCase()}&amount=${options.quantity}&type=${side.toLowerCase()}`;
        if(type.toLowerCase() === 'limit'){
            queryString+=`&price=${options.price}`;
        }
        const signature=createSignature(ExchangeInfo.Digifinex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['ACCESS-SIGN']=signature;
        this.#header['ACCESS-TIMESTAMP']=timestamp;
        try{
            logger.debug(`digifinex.spot.order.createOrder.url:${queryString}`);
            await this.axiosInstance.post(endpoint, queryString,{
                headers: this.#header
            }).then(async res=>{
                if(res.data.code === 0){
                    let result = await this.getOrder(fsym, tsym, res.data.order_id);
                    if(result.success){
                        response.success = true;
                        response.data = {
                            ename: this.#name,
                            fsym: result.data.fsym,
                            tsym: result.data.tsym,
                            quantity: result.data.quantity,
                            orderId: result.data.orderId,
                            executedQty: result.data.executedQty,
                            quoteQty: result.data.quoteQty,
                            price: result.data.price,
                            clientOrderId: result.data.clientOrderId,
                            status: result.data.status,
                            type: result.data.type,
                            side: result.data.side,
                            fills: null,
                            rawData: res.data
                        }
                    }else{
                        response.success = false;
                        response.data= result.data;
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode[res.data.code]
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`digifinex.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`digifinex.spot.order.createOrder.error: ${error}`);
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
        let response = {
            success:false,
            data:null
        };
        const timestamp= Math.floor(Date.now() / 1000);
        const method='POST';
        let endpoint = `spot/order/cancel`;
        let queryString=`order_id=${orderId}`;
        const signature=createSignature(ExchangeInfo.Digifinex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['ACCESS-SIGN']=signature;
        this.#header['ACCESS-TIMESTAMP']=timestamp;
        try{
            logger.debug(`digifinex.spot.order.cancelSingle.url:${queryString}`);
            await this.axiosInstance.post(endpoint, queryString,{
                headers: this.#header
            }).then(async res=>{
                if(res.data.code !== 0){
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode[res.data.code]
                    }
                }else{
                    let result = await this.getOrder(fsym, tsym, orderId);
                    if(result.success){
                        response.success = true;
                        response.data = {
                            rawData: res.data,
                            fsym: result.data.fsym,
                            tsym: result.data.tsym,
                            ename: this.#name,
                            orderId: result.data.orderId,
                            status: result.data.status
                        }
                    }else{
                        response.success = false;
                        response.data = result.data;

                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`digifinex.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`digifinex.spot.order.cancelSingle.error: ${error}`);
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
        let response = {
            success:false,
            data:null
        };
        const timestamp=Math.floor(Date.now() / 1000);
        const method='GET';
        let endpoint = `/spot/order/detail`
        let queryString=`order_id=${orderId}`;
        const signature=createSignature(ExchangeInfo.Digifinex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['ACCESS-SIGN']=signature;
        this.#header['ACCESS-TIMESTAMP']=timestamp;
        try{
            logger.debug(`digifinex.spot.order.getOrder.url:${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code !== 0){
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode[res.data.code]
                    }
                }else{
                    response.success = true;
                    let orderType = res.data.type;
                    let side = '', type = '';
                    if(orderType === 'buy_market'){
                        type = 'market';
                        side =  'buy';
                    }else if(orderType === 'sell_market'){
                        type = 'market';
                        side =  'sell';
                    }else if(orderType === 'buy' || orderType ==='sell'){
                        type = 'limit';
                        side =  orderType;
                    }
                    let pairs = res.data.symbol.split('_')
                    response.data = {
                        fsym: pairs[0],
                        tsym: pairs[1],
                        ename: this.#name,
                        orderId: res.data.order_id,
                        clientOrderId: null,
                        price:res.data.price,
                        quantity: res.data.amount,
                        executedQty: res.data.executed_amount,
                        quoteQty: dataCalculation(res.data.avg_price, res.data.executed_amount, '*'),
                        status: this.upOrderStatus(res.data.status),
                        type: type,
                        side: side,
                        time: parseInt(res.data.created_date) * 1000 ,
                        updateTime: parseInt(res.data.finished_date) * 1000 ,
                        rawData: res.data
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`digifinex.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`digifinex.spot.order.getOrder.error: ${error}`);
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
    async getOrders(fsym, tsym, options){
        let response = {
            success:false,
            data:null
        };
        const timestamp=Math.floor(Date.now() / 1000);
        const method='GET';
        let symbol=`${fsym}_${tsym}`;
        let endpoint = `/spot/order/history`
        let queryString=`symbol=${symbol}`;
        if(options){
            for(let key in options){
                if(options[key]){
                    if(key === 'limit'){
                        queryString+=`&limit=${options[key]}`;
                    }else if(key === 'startTime'){
                        queryString+=`&start_time=${options[key]}`;
                    }else if(key === 'endtTime'){
                        queryString+=`&end_time=${options[key]}`;
                    }
                }
            }
        }
        const signature=createSignature(ExchangeInfo.Digifinex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['ACCESS-SIGN']=signature;
        this.#header['ACCESS-TIMESTAMP']=timestamp;
        try{
            logger.debug(`digifinex.spot.order.getOrder.url:${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code !== 0){
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode[res.data.code]
                    }
                }else{
                    let lists = [];
                    res.data.data.forEach(item=>{
                        let orderType = item.type;
                        let side = '', type = '';
                        if(orderType === 'buy_market'){
                            type = 'market';
                            side =  'buy';
                        }else if(orderType === 'sell_market'){
                            type = 'market';
                            side =  'sell';
                        }else if(orderType === 'buy' || orderType ==='sell'){
                            type = 'limit';
                            side =  orderType;
                        }
                        let pairs = item.symbol.split('_')
                        let dicData = {
                            fsym: pairs[0],
                            tsym: pairs[1],
                            orderId: item.order_id,
                            clientOrderId: '',
                            price: item.price,
                            quantity: item.amount,
                            executedQty: item.executed_amount,
                            quoteQty: dataCalculation(itme.avg_price, itme.executed_amount, '*'),
                            status: this.upOrderStatus(item.status),
                            type: type,
                            side: side,
                            time: parseInt(res.data.created_date) * 1000 ,
                            updateTime: parseInt(res.data.finished_date) * 1000 ,
                         }
                        lists.push(dicData)
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists: lists,
                        rawData: res.data
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`digifinex.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`digifinex.spot.order.getOrder.error: ${error}`);
            return response;
        }
    }


}
module.exports = {Order}