const {axios,createSignature, ExchangeInfo, dataCalculation, logger} =require ("../../../utils/utils");

class Order{
    #apiKey='';
    #secretKey='';
    #name = '';
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

    updateStatus(status){
        let order_status = 'NEW';
        if(status === 'open'){
            order_status = 'NEW';
        }else if(status === 'closed'){
            order_status = 'FILLED';
        }else if(status === 'cancelled'){
            order_status = 'CANCELED';
        }
        return order_status;
    }

    async createOrder(fsym, tsym, side, type, options){
        const timestamp=Math.floor(Date.now() / 1000);
        const method = 'POST'
        const endpoint=`/api/v4/spot/orders`
        let symbol = `${fsym}_${tsym}`;
        let queryBody={
            text:'t-'+Date.now(),
            currency_pair:symbol.toUpperCase(),
            type:'limit',
            side:side,
            amount:options.quantity,
            price: options.price,
            time_in_force: options.timeInForce ? options.timeInForce.toLowerCase() :'gtc'
        }
        const signature=createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            '',
            method,
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
            logger.debug(`gateio.spot.order.createOrder.url: ${endpoint}, params: ${JSON.stringify(queryBody)}`);
            await this.axiosInstance.post(endpoint,queryBody,{
                headers: this.#header
            }).then(res=>{
                let status = this.updateStatus(res.data.status);
                response.success = true;
                response.data = {
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    quantity: res.data.amount,
                    orderId: res.data.id,
                    executedQty: dataCalculation(res.data.amount, res.data.left, '-'),
                    quoteQty: res.data.filled_total,
                    price:  res.data.price,
                    clientOrderId: res.data.text,
                    status: status,
                    type: res.data.type.toLowerCase(),
                    side: res.data.side.toLowerCase(),
                    files: null,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`gateio.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.order.createOrder.error: ${error}`);
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
        const endpoint=`/api/v4/spot/orders/${orderId}`;
        let symbol = `${fsym}_${tsym}`;
        let queryString = `currency_pair=${symbol}`;
        const signature = createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            queryString,
            'delete',
            endpoint,
            timestamp);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try {
            logger.debug(`gateio.spot.oder.cancelSingle.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.delete(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                let status = this.updateStatus(res.data.status);
                response.success = true;
                response.data = {
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
                    msg: 'gateio.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`gateio.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.order.cancelSingle.error: ${error}`);
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
        const endpoint=`/api/v4/spot/orders/${orderId}`;
        let symbol = `${fsym}_${tsym}`;
        let queryString = 'currency_pair='+symbol;
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
            logger.debug(`gateio.spot.order.getOrder.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                let status = this.updateStatus(res.data.status);
                response.success = true;
                response.data ={
                    fsym:fsym,
                    tsym: tsym,
                    ename: this.#name,
                    orderId: res.data.id,
                    clientOrderId: res.data.text,
                    price: res.data.price,
                    quantity: res.data.amount,
                    executedQty: dataCalculation(res.data.amount, res.data.left, '-'),
                    quoteQty: res.data.filled_total,
                    status:  status,
                    type: res.data.type.toLowerCase(),
                    side: res.data.side.toLowerCase(),
                    time: res.data.create_time_ms,
                    updateTime: res.data.update_time_ms,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`gateio.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.order.getOrder.error: ${error}`);
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
        const endpoint='/api/v4/spot/orders';
        let  symbol = `${fsym}_${tsym}`;
        let queryString = `currency_pair=${symbol}&status=finished`;
        if(options){
            for(let key in options){
                if(key === 'startTime' && options[key]){
                    queryString += `&from=${options[key]}`;
                }
                if(key === 'endTime' && options[key]){
                    queryString += `&to=${options[key]}`;
                }
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
            logger.debug(`gateio.spot.order.getOrders.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let status = this.updateStatus(item.status);
                    let dicData={
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.id,
                        clientOrderId: item.text,
                        price: item.price,
                        quantity: item.amount,
                        executedQty: dataCalculation(item.amount, item.left, '-'),
                        quoteQty: item.filled_total,
                        status: status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time: item.create_time_ms,
                        updateTime: item.update_time_ms
                    }
                    lists.push(dicData);
                })

                response.success = true;
                response.data = {
                    ename: this.#name,
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`gateio.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.order.getOrders.error: ${error}`);
            return response;
        }

    }


    /**
     * getOpenOrders
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOpenOrders(fsym, tsym) {
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint='/api/v4/spot/orders';
        let  symbol = `${fsym}_${tsym}`;
        let queryString = `currency_pair=${symbol}&status=open`;
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
            logger.debug(`gateio.spot.order.getOrders.url: ${endpoint}?${queryString}`);
            await this.axiosInstance.get(`${endpoint}?${queryString}`,{
                headers:this.#header
            }).then(res=>{
                let lists = [];
                res.data.forEach(item=>{
                    let status = this.updateStatus(item.status);
                    let dicData={
                        fsym:fsym,
                        tsym: tsym,
                        orderId: item.id,
                        clientOrderId: item.text,
                        price: item.price,
                        quantity: item.amount,
                        executedQty: dataCalculation(item.amount, item.left, '-'),
                        quoteQty: item.filled_total,
                        status: status,
                        type: item.type.toLowerCase(),
                        side: item.side.toLowerCase(),
                        time: item.create_time_ms,
                        updateTime: item.update_time_ms
                    }
                    lists.push(dicData);
                })

                response.success = true;
                response.data = {
                    ename: this.#name,
                    lists: lists,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`gateio.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.spot.order.getOrders.error: ${error}`);
            return response;
        }

    }
}
module.exports={Order}