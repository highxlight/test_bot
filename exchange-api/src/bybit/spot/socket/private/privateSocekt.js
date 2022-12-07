const { Websocket, events, logger} = require("../../../../utils/utils");
const {createHmac} = require('crypto')

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name='';

    constructor(name, apiKey,secretKey, endpoint, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }
    async orderStateUpdate(){
        let url = `${this.wsURL}/ws`;
        let msg ={
            "op": "subscribe",
            "args": ['order']
        }
        return this.subscribe(url, msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.topic;
        switch (e_type){
            case 'order':
                try {
                    pl.data.forEach(item=>{
                        let upData={
                            eventType: 'executionReport',
                            eventTime:item.E,
                            ename: this.#name,
                            exchange: 'bybit',
                            clientOrderId: item.c,
                            orderId: item.i,
                            side:item.S.toLowerCase(),
                            type:item.o.toLowerCase(),
                            status:item.X,
                            executedQty:item.z,
                            quoteQty:item.Z,
                            updateTime: null,
                            rawData: pl
                        }
                        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
                    })
                }catch (err){
                    logger.error(`bybit.spot.socket.private.upOrder.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
        }
    }


    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws
            ws.on('open', ()=>{
                const expires = Date.now() + 10000;
                const signature = createHmac("sha256", this.#secretKey).update("GET/realtime" + expires).digest("hex");
                const payload={
                    op: "auth",
                    args: [this.#apiKey, expires.toFixed(0), signature],
                }
                ws.send(JSON.stringify(payload));
                setInterval(()=>{
                    ws.send(JSON.stringify({ping:Date.now()}));
                }, 30000);
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if('topic' in pl){
                    this.dataFormat(JSON.stringify(pl));
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
                    logger.error(`bybit spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('bybit spot privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('bybit spot privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                objRef.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`bybit spot privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}