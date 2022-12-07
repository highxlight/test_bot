const {Websocket, ExchangeInfo, timeFormat, dataCalculation, createSignature, axios, events, logger} = require("../../../../utils/utils");
const {createHmac} = require('crypto');


class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'X-ACCESS-KEY': '', //APIKey
        'X-ACCESS-SIGN': '', // signature
        'X-ACCESS-NONCE': '', // timestamp
    }

    constructor(name, apiKey,secretKey, endpoint, socketUrl, timeout) {
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#header['X-ACCESS-KEY'] = apiKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }
    async getUserID(){
        const method="GET"
        const timestamp= Date.now();
        const endpoint='/v2/user/info';
        const signature=createSignature(ExchangeInfo.Aax.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp,
            '');
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.socket.private.getUserid.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1){
                    response.success = true;
                    response.data ={
                        userId: res.data.data.userID
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'aax.spot.socket.private.getUserid:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`aax.spot.socket.private.getUserid.err: ${err}`);
            })
            logger.info(`aax.spot.socket.private.getUserid.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.socket.private.getUserid.error: ${error}`);
            return response;
        }
    }

    loign(){
        let timestamp = Date.now();
        let presigned = `${timestamp}:${this.#apiKey}`;
        let sign = createHmac('sha256',this.#secretKey).update(presigned).digest('hex');
        let msg = {
            event: "login",
            data:{apiKey:this.#apiKey, nonce: timestamp, signature:sign}
        }
        return {msg: msg, url:this.wsURL}

    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 0:
                orderStatus = 'REJECTED';
                break;
            case 2:
                orderStatus = 'PARTIALLY_FILLED';
                break;
            case 3:
                orderStatus = 'FILLED';
                break;
            case 4:
                orderStatus = 'EXPIRED';
                break;
            case 5:
                orderStatus = 'CANCELED';
                break;
            case 6:
            case 10:
            case 11:
                orderStatus = 'EXPIRED';
                break;
            default:
                orderStatus = 'NEW';
                break;
        }
        return orderStatus;
    }

    async orderStateUpdate(){
        let userObj = await this.getUserID();
        if(userObj.success){
            let data =  this.loign();
            let subscribeMsg = {
                event: "#subscribe",
                data: {"event":"#subscribe","data":{"channel":`user/${userObj.data.userId}`},"cid": Date.now()}
            }
            data.subscribeMsg = subscribeMsg;
            return this.subscribe(data)
        }
    }

    dataFormat(payload){
        let result = payload.data;
        let upData={
            eventType: 'executionReport',
            eventTime: timeFormat(result.transactTime) ,
            ename: this.#name,
            exchange: 'aax',
            clientOrderId: result.clOrdID,
            orderId: result.orderID,
            status: this.upOrderStatus(result.orderStatus),
            type:result.orderType === 1 ? 'market' : result.orderType === 2 ? 'limit' : result.orderType,
            side:result.side === 1 ? 'buy' : 'sell',
            executedQty:result.cumQty,
            quoteQty:  dataCalculation(result.avgPrice, result.cumQty, '*'),
            updateTime: timeFormat(result.updateTime),
            rawData: payload
        }
        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
    }


    subscribe (params) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            try{
                const ws = new Websocket(params.url);
                ws.on('open', ()=>{
                    ws.send(JSON.stringify({"event":"#handshake","cid":1}))
                    ws.send(JSON.stringify(params.msg));
                })
                ws.on('message', (data)=>{
                    if(data !== '#1'){
                        const pl = JSON.parse(data);
                        if('error' in pl){
                            logger.error(`aax.future.socket.private.error: ${JSON.stringify(pl.error.message)}`)
                        }else{
                            if('isAuthenticated' in pl.data ){
                                if(pl.data.isAuthenticated){
                                    ws.send(JSON.stringify(params.subscribeMsg));
                                    wsRef.unMsg = data.subscribeMsg;
                                }
                            }else if(pl.event === 'SPOT'){
                                this.dataFormat(pl);
                            }
                        }
                    }else{
                        ws.send('#2');
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })
                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`aax spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('aax spot privateSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`aax.private.socket.error:${err.message}`)
            }

        }
        logger.debug(params.url);
        initConnect();
        return wsRef
    }

    unsubscribe (objwsRef) {
        if (!objwsRef || !objwsRef.ws) {
            logger.warn('aax spot privateSocket no connection to close.')
        }else {
            try{
                objwsRef.unMsg.op = "#unsubscribe";
                objwsRef.ws.send(JSON.stringify(objwsRef.unMsg));
            }catch (err){
                logger.error(`aax spot privateSocket no connection to close.err:${err.message}`)
            }
            objwsRef.closeInitiated = true
            objwsRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}