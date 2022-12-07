const {axios, Websocket, timeFormat, events, logger} = require("../../../../utils/utils");
const {createHmac} =require('crypto');

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name = '';

    constructor(name, apiKey, secretKey, endpoint, socketUrl, timeout) {
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    async orderStateUpdate(){
        let message = {"op": "subscribe", "args": "order"};
        return this.subscribe(this.wsURL, message)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        if('data' in pl){
            pl = pl.data[0];
            let upData={
                eventType: 'executionReport',
                eventTime: timeFormat(pl.timestamp),
                ename:this.#name,
                exchange: 'bitmex',
                clientOrderId: pl.clOrdLinkID,
                orderId: pl.orderID,
                side: pl.side.toLowerCase(),
                type: pl.ordType.toLowerCase(),
                status: pl.ordStatus.toUpperCase(),
                executedQty: pl.cumQty,
                quoteQty: pl.orderQty,
                updateTime: timeFormat(pl.timestamp),
                rawData: pl
            }
            this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_FUTURE_OR_UPDATE`, upData);
        }
    }


    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws;
            ws.on('open', ()=>{
                let expires = Date.now() + 10;
                let signature= createHmac('sha256',this.#secretKey).update('GET/realtime' +expires).digest('hex');
                let authMsg = {"op": "authKeyExpires", "args": [this.#apiKey,expires, signature]}
                ws.send(JSON.stringify(authMsg));
                setInterval(()=>{
                    ws.send('ping');
                }, 5000)
            })
            ws.on('message', (data)=>{
                if(data !== 'pong'){
                    const pl = JSON.parse(data);
                    if('success' in pl){
                        if(pl.success){
                            ws.send(JSON.stringify(msg));
                            wsRef.unMsg = msg;
                        }
                    }else if(pl.action === 'update' || pl.action === 'insert' || pl.action === 'delete'){
                        this.dataFormat(JSON.stringify(pl));
                    }
                }
            })
            ws.on('ping', () => {
                // logger.debug('Received ping from server')
                ws.pong()
            })

            ws.on('pong', () => {
                // logger.debug('Received pong from server')
            })

            ws.on('error', err => {
                logger.error(err)
            })

            ws.on('close', (closeEventCode, reason) => {
                if (!wsRef.closeInitiated) {
                    logger.error(`bitmex  future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('bitmex  future privateSocket reconnect to the server.')
                        initConnect()
                    }, this.reconnectDelay)
                } else {
                    wsRef.closeInitiated = false
                }
            })
        }
        logger.debug(url)
        initConnect()
        return wsRef
    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) logger.warn('bitmex  future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsubscribe'
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`bitmex  future privateSocket no connection to close.err:${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}