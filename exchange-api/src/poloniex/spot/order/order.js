const {axios, timeFormat, createSignature, dataCalculation, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Order {


    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'Key': '', //APIKey
        'Sign': '' // signature
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
        this.axiosInstance = axios.create({baseURL: `${endpoint}/tradingApi`, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#header['Key']=this.#apiKey;
    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 'Open':
                orderStatus = "NEW";
                break;
            case 'Partially':
                orderStatus = "PARTIALLY_FILLED";
                break;
            case 'filled':
                orderStatus = "FILLED";
                break;
            case 'cancelled':
                orderStatus = "CANCELED";
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
        const timestamp=Date.now();
        const method='POST';
        let symbol = `USDT_BTC`;
        if(type.toLowerCase() === 'market'){
            response.success = false;
            response.data = {
                code: 400,
                msg: 'this exchange only supports limit orders'
            }
            return  response;
        }
        let queryString=`command=${side.toLowerCase()}&currencyPair=${symbol.toUpperCase()}&rate=${options.price}&amount=${options.quantity}&nonce=${timestamp}`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['Sign']=signature;
        try{
            logger.debug(`poloinex.spot.order.createOrder.url:${queryString}`);
            await this.axiosInstance.post(``,queryString,{
                headers: this.#header
            }).then(res=>{
                if('error' in res.data){
                     response.success = false;
                     response.data = {
                         code: null,
                         msg: res.data.error
                     }
                }else{
                    let pairs = res.data.currencyPair.split('_')
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        fsym: pairs[0],
                        tsym: pairs[1],
                        quantity: res.data.amount,
                        orderId: res.data.orderNumber,
                        executedQty: 0,
                        quoteQty: res.data.resultingTrades[0].total,
                        price: res.data.rate,
                        clientOrderId: res.data.clientOrderId,
                        status: 'NEW',
                        type: 'limit',
                        side: res.data.type,
                        fills: res.data.resultingTrades,
                        rawData: res.data
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloinex.spot.order.createOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloinex.spot.order.createOrder.err: ${err}`);
            })
            logger.info(`poloinex.spot.order.createOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`poloinex.spot.order.createOrder.error: ${error}`);
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
        const timestamp=Date.now();
        const method='POST';
        let queryString=`command=cancelOrder&orderNumber=${orderId}&nonce=${timestamp}`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['Sign']=signature;
        try{
            logger.debug(`poloinex.spot.order.cancelSingle.url:${queryString}`);
            await this.axiosInstance.post(``,queryString,{
                headers: this.#header
            }).then(res=>{
                if(res.data.success !== 1){
                    response.success = false;
                    response.data = {
                        code: null,
                        msg: res.data.error
                    }
                }else{
                    response.success = true;
                    response.data = {
                        rawData: res.data,
                        fsym: fsym,
                        tsym: tsym,
                        ename: this.#name,
                        orderId: orderId,
                        status: 'CANCELED'
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloinex.spot.order.cancelSingle:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloinex.spot.order.cancelSingle.err: ${err}`);
            })
            logger.info(`poloinex.spot.order.cancelSingle.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`poloinex.spot.order.cancelSingle.error: ${error}`);
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
        const timestamp=Date.now();
        const method='POST';
        let queryString=`command=returnOrderStatus&orderNumber=${orderId}&nonce=${timestamp}`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['Sign']=signature;
        try{
            logger.debug(`poloinex.spot.order.getOrder.url:${queryString}`);
            await this.axiosInstance.post(``,queryString,{
                headers: this.#header
            }).then(res=>{
                if(res.data.success !== 1){
                    response.success = false;
                    response.data = {
                        code: null,
                        msg: res.data.result.error
                    }
                }else{
                    let data = {};
                    let result =  res.data.result;
                    for(let key in result){
                        let pairs = result[key].split('_');
                        data.fsym = pairs[0];
                        data.tsym = pairs[1];
                        data.ename = this.#name;
                        data.orderId = key;
                        data.clientOrderId = null;
                        data.price = result[key].rate;
                        data.quantity = result[key].startingAmount;
                        data.executedQty = dataCalculation(result[key].startingAmount, result[key].amount, '-');
                        data.quoteQty = result[key].total;
                        data.status = this.upOrderStatus(result[key].status);
                        data.type = 'limit';
                        data.side = result[key].type;
                        data.time = timeFormat(result[key].date);
                        data.updateTime = null;
                    }
                    data.rawData = res.data;
                    response.success = true;
                    response.data = data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloinex.spot.order.getOrder:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloinex.spot.order.getOrder.err: ${err}`);
            })
            logger.info(`poloinex.spot.order.getOrder.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`poloinex.spot.order.getOrder.error: ${error}`);
            return response;
        }
    }

    /**
     * getOrders
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getOrders(fsym, tsym){
        let response = {
            success:false,
            data:null
        };
        let symbol = `${fsym}_${tsym}`;
        const timestamp=Date.now();
        const method='POST';
        let queryString=`command=returnTradeHistory&currencyPair=${symbol}&nonce=${timestamp}`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['Sign']=signature;
        try{
            logger.debug(`poloinex.spot.order.getOrders.url:${queryString}`);
            await this.axiosInstance.post(``,queryString,{
                headers: this.#header
            }).then(res=>{
                if(res.data.length === 0){
                    response.success = false;
                    response.data = {
                        code: null,
                        msg: res.data
                    }
                }else{
                    let lists = [];
                    let result =  res.data;
                    result.forEach(item=>{
                        let dicData= {
                            fsym:fsym,
                            tsym: tsym,
                            orderId: item.orderNumber,
                            clientOrderId: '',
                            price: item.rate,
                            quantity: '',
                            executedQty: item.amount,
                            quoteQty: item.total,
                            status: null,
                            type: 'limit',
                            side: item.type,
                            time: timeFormat(item.date),
                            updateTime: null
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists: lists,
                        rawData: res.data
                    };
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloinex.spot.order.getOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloinex.spot.order.getOrders.err: ${err}`);
            })
            logger.info(`poloinex.spot.order.getOrders.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`poloinex.spot.order.getOrders.error: ${error}`);
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
        let response = {
            success:false,
            data:null
        };
        let symbol = `${fsym}_${tsym}`;
        const timestamp=Date.now();
        const method='POST';
        let queryString=`command=returnOpenOrders&currencyPair=${symbol}&nonce=${timestamp}`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['Sign']=signature;
        try{
            logger.debug(`poloinex.spot.order.getOpenOrders.url:${queryString}`);
            await this.axiosInstance.post(``,queryString,{
                headers: this.#header
            }).then(res=>{
                if(res.data.length === 0){
                    response.success = false;
                    response.data = {
                        code: null,
                        msg: res.data
                    }
                }else{
                    let lists = {};
                    let result =  res.data;
                    result.forEach(item=>{
                        let dicData= {
                            sym:fsym,
                            tsym: tsym,
                            orderId: item.orderNumber,
                            clientOrderId: item.clientOrderId,
                            price: item.rate,
                            quantity: null,
                            executedQty: item.amount,
                            quoteQty: item.total,
                            status: item.amount > 0 ? 'PARTIALLY_FILLED' : 'NEW',
                            type: 'limit',
                            side: item.type,
                            time:  timeFormat(item.date),
                            updateTime: null
                        }
                        lists.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        lists: lists,
                        rawData: res.data
                    };
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloinex.spot.order.getOpenOrders:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloinex.spot.order.getOpenOrders.err: ${err}`);
            })
            logger.info(`poloinex.spot.order.getOpenOrders.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`poloinex.spot.order.getOpenOrders.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Order}