const {Websocket, events, logger} = require("../../../../utils/utils");
const {createHmac} = require('crypto');


class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #passphrase='';
    #name='';

    constructor(name, apiKey,secretKey,passphrase, socketUrl) {
        this.#apiKey = apiKey;
        this.#name = name;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.wsURL = `${socketUrl}/user?protocol=1.1`;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    loign(){
        let timestamp = Date.now();
        let presigned = `${timestamp}#${this.#passphrase}#bitmart.WebSocket`;
        let sign = createHmac('sha256',this.#secretKey).update(presigned).digest('hex');
        let msg = {
            op: "login",
            args:[this.#apiKey, timestamp, sign ]
        }
        return {msg: msg, url:this.wsURL}

    }

    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status){
            case 1:
                orderStatus = 'REJECTED';
                break;
            case 3:
                orderStatus = 'REJECTED';
                break;
            case 5:
                orderStatus = 'PARTIALLY_FILLED';
                break;
            case 6:
                orderStatus = 'FILLED';
                break;
            case 7:
                orderStatus = 'PENDING_CANCEL';
                break;
            case 8:
                orderStatus = 'CANCELED';
                break;
            default:
                orderStatus = 'NEW';
                break;
        }
    }

    async orderStateUpdate(){
        let data =  this.loign();
        let subscribeMsg = {
            event: "subscribe",
            arg: ['spot/user/order']
        }
        data.subscribeMsg = subscribeMsg;
        return this.subscribe(data)
    }

    dataFormat(payload){
        let results = payload.data;
        results.forEach(item=>{
            let upData={
                eventType: 'executionReport',
                eventTime: item.ms_t,
                ename: this.#name,
                exchange: 'bitmart',
                clientOrderId: item.clOrdId,
                orderId: item.order_id,
                side: item.side,
                type: item.type,
                status: this.upOrderStatus(item.state),
                executedQty:item.filled_size,
                quoteQty: item.filled_notional,
                updateTime: item.last_fill_time,
                rawData: payload
            }
            this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
        })
    }


    subscribe (params) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            try{
                const ws = new Websocket(params.url);
                ws.on('open', ()=>{
                    ws.send(JSON.stringify(params.msg));
                })
                ws.on('message', (data)=>{
                    if(data !== 'pong'){
                        const pl = JSON.parse(data);
                        if('event' in pl){
                            if(pl.event === 'login'){
                                setInterval(()=>{
                                    ws.send('ping');
                                }, 18000)
                                ws.send(JSON.stringify(params.subscribeMsg));
                                wsRef.unMsg = params.subscribeMsg;
                            }
                        }else if(pl.table === 'spot/user/order'){
                            this.dataFormat(pl);
                        }
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })
                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`bitmart spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('bitmart spot privateSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`bitmart.private.socket.error:${err.message}`)
            }

        }
        logger.debug(params.url);
        initConnect();
        return wsRef
    }

    unsubscribe (objwsRef) {
        if (!objwsRef || !objwsRef.ws) {
            logger.warn('bitmart spot privateSocket no connection to close.')
        }else {
            try{
                objwsRef.unMsg.op = "unsubscribe";
                objwsRef.ws.send(JSON.stringify(objwsRef.unMsg));
            }catch (err){
                logger.error(`bitmart spot privateSocket no connection to close.err:${err.message}`)
            }
            objwsRef.closeInitiated = true
            objwsRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}