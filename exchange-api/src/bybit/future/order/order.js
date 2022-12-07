const {axios, createSignature, timeFormat, ExchangeInfo, logger} = require("../../../utils/utils");

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
     */
    constructor(name, apiKey,secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
    }
    async splicingSymbol(fsym, tsym){
        let now = new Date();
        let noMonth = now.getMonth() + 1;
        let year = now.getFullYear().toString();
        let year_n = year.substr(year.length-2);
        let currQuarter = Math.floor( ( noMonth % 3 == 0 ? ( noMonth / 3 ) : ( noMonth / 3 + 1 ) ) );
        let list=['H', 'M', 'U', 'Z'];
        return `${fsym}${tsym}${list[currQuarter-1]}${year_n}`;
    }

    async createOrder(fsym, tsym, side, type, options){
        const timestamp = Date.now();
        let inforce={
            GTC:'GoodTillCancel',
            IOC:'ImmediateOrCancel',
            FOK:'FillOrKill'
        }
        let lsym = tsym
        if(tsym === 'USDT'){
            lsym = 'USD';
        }
        let symbol = await this.splicingSymbol(fsym, lsym);
        var queryString='';
        let requestBody={
            api_key:this.#apiKey,
            position_idx: 0,
            qty:options.quantity,
            side:side.toLowerCase() === 'buy' ? 'Buy': 'Sell',
            symbol: symbol,
            order_type:type.toLowerCase() === 'limit' ? 'Limit ' : 'Market',
            timestamp:timestamp
        }
        if('timeInForce' in options){
            requestBody.time_in_force = inforce[options.timeInForce];
        }else{
            requestBody.time_in_force = inforce.GTC;
        }
        if(type.toLowerCase() === 'limit'){
            requestBody.price = options.price;
            requestBody.time_in_force = inforce[options.timeInForce];
        }
        Object.keys(requestBody).sort().forEach(function(key) {
            queryString += key + "=" + requestBody[key] + "&";
        });
        queryString = queryString.substring(0, queryString.length - 1);
        logger.debug(`bybit.future.order.createOrder.req:${queryString}`);
        let signature=createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);
        requestBody['sign']=signature
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint =`/futures/private/order/create`;
            logger.debug(`bybit.future.order.createOrder.url:${endpoint}, params:${JSON.stringify(requestBody)}`);
            await this.axiosInstance.post(endpoint, requestBody,{
                headers:{'Content-Type':'application/json; charset=utf-8'}
            }).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename:this.#name,
                        quantity: res.data.result.qty,
                        orderId: res.data.result.order_id,
                        executedQty: res.data.result.cum_exec_qty,
                        quoteQty:res.data.result.cum_exec_value,
                        price: res.data.result.price,
                        clientOrderId: res.data.result.order_link_id,
                        status: res.data.result.order_status.toUpperCase(),
                        type: res.data.result.order_type.toLowerCase(),
                        side: res.data.result.side.toLowerCase(),
                        files: null,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.order.createOrder.err: ${err}`);
            })
            logger.info(`bybit.future.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.order.createOrder.error: ${error}`);
            return response
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
        const timestamp = Date.now().toString();
        const endpoint = '/futures/private/order';
        let lsym = tsym
        if(tsym === 'USDT'){
            lsym = 'USD';
        }
        let symbol = await this.splicingSymbol(fsym, lsym);
        var queryString = 'api_key='+this.#apiKey
            +'&order_id='+orderId
            +'&symbol='+symbol
            +'&timestamp='+timestamp;

        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);

        queryString += '&sign='+signature;
        logger.debug(`bybit.future.order.getOrder.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.future.order.getOrder.url:${endpoint}?${queryString}`);
            await this.axiosInstance.get(endpoint + '?' + queryString).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym:fsym,
                        tsym: tsym,
                        ename:this.#name,
                        orderId: res.data.result.order_id,
                        clientOrderId: res.data.result.order_link_id,
                        price: res.data.result.price,
                        quantity: res.data.result.qty,
                        executedQty: res.data.result.cum_exec_qty,
                        quoteQty: res.data.result.cum_exec_value,
                        status: res.data.result.order_status.toUpperCase(),
                        type: res.data.result.order_type.toLowerCase(),
                        side: res.data.result.side.toLowerCase(),
                        time: timeFormat(res.data.result.created_at),
                        updateTime: timeFormat(res.data.result.updated_at),
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.order.getOrder.err: ${err}`);
            })
            logger.info(`bybit.future.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.order.getOrder.error: ${error}`);
            return response
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
        const timestamp = Date.now().toString();
        const endpoint = '/futures/private/order/list';
        let lsym = tsym
        if(tsym === 'USDT'){
            lsym = 'USD';
        }
        let symbol = await this.splicingSymbol(fsym, lsym);
        let queryString = 'api_key='+this.#apiKey
            +'&symbol='+symbol
            +'&timestamp='+timestamp;
        if(options){
            for(let key in options){
                if(key.toLowerCase() === 'limit' && options[key]){
                    queryString += `&${key}=${options[key]}`;
                }
            }
        }
        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);

        queryString += '&sign='+signature;
        logger.debug(`bybit.future.order.getOrders.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.future.order.getOrders.url:${endpoint}?${queryString}`);
            await this.axiosInstance.get(endpoint + '?' + queryString).then(res=>{
                if(res.data.ret_code === 0){
                    let lists = [];
                    if(res.data.result.data){
                        let result = res.data.result.data;
                        result.forEach(item=>{
                            let dicData = {
                                fsym:fsym,
                                tsym: tsym,
                                orderId: item.order_id,
                                clientOrderId: item.order_link_id,
                                price: item.price,
                                quantity: item.qty,
                                executedQty: item.cum_exec_qty,
                                quoteQty: item.cum_exec_value,
                                status: item.order_status.toUpperCase(),
                                type: item.order_type.toLowerCase(),
                                side: item.side.toLowerCase(),
                                time: timeFormat(item.created_at),
                                updateTime: timeFormat(item.updated_at)
                            }
                            lists.push(dicData);
                        })
                    }
                    response.success = true;
                    response.data = {
                        ename:this.#name,
                        lists: lists,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.order.getOrders.err: ${err}`);
            })
            logger.info(`bybit.future.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.order.getOrders.error: ${error}`);
            return response
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
        const timestamp = Date.now().toString();
        const endpoint = '/futures/private/order/cancel';
        let lsym = tsym
        if(tsym === 'USDT'){
            lsym = 'USD';
        }
        let symbol = await this.splicingSymbol(fsym, lsym);
        let queryString = 'api_key='+this.#apiKey
            +'&order_id='+orderId
            +'&symbol='+symbol
            +'&timestamp='+timestamp;

        const signature = createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);
        queryString += '&sign='+signature;
        logger.debug(`bybit.future.order.cancelSingle.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            logger.debug(`bybit.future.order.cancelSingle.url:${endpoint}?${queryString}`)
            await this.axiosInstance.delete(`${endpoint}?${queryString}`).then(res=>{
                if(res.data.ret_code === 0){
                    response.success = true;
                    response.data = {
                        fsym: fsym,
                        tsym: tsym,
                        ename:this.#name,
                        orderId: res.data.result.order_id,
                        status: res.data.result.order_status.toUpperCase(),
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.future.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.future.order.getOrders.err: ${err}`);
            })
            logger.info(`bybit.future.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.future.order.cancelSingle.error: ${error}`);
            return response
        }
    }
}
module.exports = {Order}
