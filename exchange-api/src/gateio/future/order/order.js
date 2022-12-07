const {axios,createSignature, dataCalculation, ExchangeInfo} =require ("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order{
    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        'KEY':'',
        'Timestamp':'',
        'SIGN':'',
    }
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
        this.#header.KEY=this.#apiKey;
    }

    async createOrder(fsym, tsym, side, type, options){
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint =`/api/v4/futures/usdt/orders`;
        let symbol = `${fsym}_${tsym}`;
        let quantity = 0, tif='', price=0;
        if(side === 'sell') {
            quantity = `-${options.quantity}`
        }else{
            quantity = `${options.quantity}`
        }
        if(type.toLowerCase() === 'market'){
            tif='ioc';
            price=0;
        }else{
            tif = options.timeInForce ? options.timeInForce.toLowerCase() : 'gtc' ;
            price = options.price;
        }
        let queryBody={
            contract:symbol.toUpperCase(),
            size:quantity,
            iceberg:0,
            price:price,
            tif: tif,
            text:'t-'+Date.now()
        }
        const signature=createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            '',
            'POST',
            endpoint,
            timestamp,
            queryBody);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.order.createOrder.url: ${endpoint}, params:${JSON.stringify(queryBody)}`);
            await this.axiosInstance.post(endpoint, queryBody,{
                headers:this.#header
            }).then(res=>{
                let status = 'NEW';
                if(res.data.status === 'finished'){
                    if(Math.abs(res.data.size) === res.data.left && res.data.finish_as ==='filled'){
                        status = 'FILLED';
                    }else if(res.data.left ===  0){
                        status= "EXPIRED";
                    }else if(res.data.finish_as ==='cancelled'){
                        status= "CANCELED";
                    }
                }else{
                    if(res.data.left >  0){
                        status= "PARTIALLY_FILLED";
                    }
                }
                let order_type = 'limit';
                if(res.data.price === 0 && res.data.tif === 'ioc'){
                    order_type = 'market';
                }
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    quantity: Math.abs(res.data.size),
                    orderId: res.data.id,
                    executedQty: dataCalculation(Math.abs(res.data.size), res.data.left, '-'),
                    quoteQty: '',
                    price: res.data.price,
                    clientOrderId: res.data.text,
                    status: status,
                    type: order_type,
                    side: parseFloat(res.data.size) < 0 ? 'sell' : 'buy',
                    files: null,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.order.createOrder.err: ${err}`);
            })
            logger.info(`gateio.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.order.createOrder.error: ${error}`);
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
    async cancelSingle(fsym, tsym, orderId) {
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint=`/api/v4/futures/usdt/orders/${orderId}`
        const signature = createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            '',
            'DELETE',
            endpoint,
            timestamp);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.order.cancelSingle.url: ${endpoint}`);
            await this.axiosInstance.delete(`${endpoint}`,{
                headers:this.#header
            }).then(res=>{
                let status = 'NEW';
                if(res.data.status === 'finished'){
                    if(Math.abs(res.data.size) === res.data.left && res.data.finish_as ==='filled'){
                        status = 'FILLED';
                    }else if(res.data.left ===  0){
                        status= "EXPIRED";
                    }else if(res.data.finish_as ==='cancelled'){
                        status= "CANCELED";
                    }
                }else{
                    if(res.data.left >  0){
                        status= "PARTIALLY_FILLED";
                    }
                }
                response.success =true;
                response.data= {
                    fsym: fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.id,
                    status: status,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.order.cancelSingle.err: ${err}`);
            })
            logger.info(`gateio.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.order.cancelSingle.error: ${error}`);
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
    async getOrder(fsym, tsym, orderId) {
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint=`/api/v4/futures/usdt/orders/${orderId}`;
        const signature=createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            '',
            'GET',
            endpoint,
            timestamp);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.order.getOrder.url: ${endpoint}`);
            await this.axiosInstance.get(`${endpoint}`,{
                headers:this.#header
            }).then(res=>{
                let status = 'NEW';
                if(res.data.status === 'finished'){
                    if(Math.abs(res.data.size) === res.data.left && res.data.finish_as ==='filled'){
                        status = 'FILLED';
                    }else if(res.data.left ===  0){
                        status= "EXPIRED";
                    }else if(res.data.finish_as ==='cancelled'){
                        status= "CANCELED";
                    }
                }else{
                    if(res.data.left >  0){
                        status= "PARTIALLY_FILLED";
                    }
                }
                let order_type = 'limit';
                if(res.data.price === 0 && res.data.tif === 'ioc'){
                    order_type = 'market';
                }
                let finish_time = '';
                if('finish_time' in res.data){
                    finish_time = parseInt(res.data.finish_time) * 1000;
                }
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.id,
                    clientOrderId: res.data.text,
                    price: res.data.price,
                    quantity: Math.abs(res.data.size),
                    executedQty: dataCalculation(Math.abs(res.data.size), res.data.left, '-'),
                    quoteQty: '',
                    status: status,
                    type: order_type,
                    side: parseFloat(res.data.size) < 0 ? 'sell' : 'buy',
                    time: parseInt(res.data.create_time) * 1000,
                    updateTime:finish_time,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.order.getOrder.err: ${err}`);
            })
            logger.info(`gateio.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.order.getOrder.error: ${error}`);
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
    async getOrders(fsym, tsym, options) {
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint='/api/v4/futures/usdt/orders';
        let symbol = `${fsym}_${tsym}`;
        let queryString = `contract=${symbol}&status=finished`;
        if(options){
            for(let key in options){
                if(key === 'limit' && options[key]){
                    queryString += `&limit=${options[key]}`;
                }
            }
        }
        const signature=createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            queryString,
            'GET',
            endpoint,
            timestamp);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.order.getOrders.url:${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let status = 'NEW';
                    if(res.data.status === 'finished'){
                        if(Math.abs(res.data.size) === res.data.left && res.data.finish_as ==='filled'){
                            status = 'FILLED';
                        }else if(res.data.left ===  0){
                            status= "EXPIRED";
                        }else if(res.data.finish_as ==='cancelled'){
                            status= "CANCELED";
                        }
                    }else{
                        if(res.data.left >  0){
                            status= "PARTIALLY_FILLED";
                        }
                    }
                    let order_type = 'limit';
                    if(item.price === 0 && item.tif === 'ioc'){
                        order_type = 'market';
                    }
                    let dicData={
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.id,
                        clientOrderId: item.text,
                        price: item.price,
                        quantity: Math.abs(item.size),
                        executedQty: dataCalculation(Math.abs(item.size), item.left, '-'),
                        quoteQty: '',
                        status: status,
                        type: order_type,
                        side: parseFloat(item.size) < 0 ? 'sell' : 'buy',
                        time: parseInt(item.create_time) * 1000,
                        updateTime: parseInt(item.finish_time) * 1000
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data ={
                    ename: this.#name,
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.order.getOrders.err: ${err}`);
            })
            logger.info(`gateio.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.order.getOrders.error: ${error}`);
            return response;
        }

    }

    /**
     *
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOpenOrders(fsym, tsym) {
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint='/api/v4/futures/usdt/orders';
        let symbol = `${fsym}_${tsym}`;
        var queryString = `contract=${symbol}&status=open`;
        const signature=createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            queryString,
            'GET',
            endpoint,
            timestamp);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.future.order.getOrders.url:${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let status = 'NEW';
                    if(res.data.status === 'finished'){
                        if(Math.abs(res.data.size) === res.data.left && res.data.finish_as ==='filled'){
                            status = 'FILLED';
                        }else if(res.data.left ===  0){
                            status= "EXPIRED";
                        }else if(res.data.finish_as ==='cancelled'){
                            status= "CANCELED";
                        }
                    }else{
                        if(res.data.left >  0){
                            status= "PARTIALLY_FILLED";
                        }
                    }
                    let order_type = 'limit';
                    if(item.price === 0 && item.tif === 'ioc'){
                        order_type = 'market';
                    }
                    let dicData={
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.id,
                        clientOrderId: item.text,
                        price: item.price,
                        quantity: Math.abs(item.size),
                        executedQty: dataCalculation(Math.abs(item.size), item.left, '-'),
                        quoteQty: '',
                        status: status,
                        type: order_type,
                        side: parseFloat(item.size) < 0 ? 'sell' : 'buy',
                        time: parseInt(item.create_time) * 1000,
                        updateTime: parseInt(item.finish_time) * 1000
                    }
                    lists.push(dicData);
                })
                response.success = true;
                response.data ={
                    ename: this.#name,
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.order.getOrders.err: ${err}`);
            })
            logger.info(`gateio.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.order.getOrders.error: ${error}`);
            return response;
        }

    }
}
module.exports={Order}