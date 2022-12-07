const { Websocket, events, logger} = require("../../../../utils/utils");
const {createHmac} = require('crypto')

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name = '';

    constructor(name, apiKey,secretKey, endpoint, socketUrl) {
        this.#apiKey = apiKey;
        this.#name = name;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }
    async orderStateUpdate(){
        let msg ={
            "op": "subscribe",
            "args": ['order']
        }
        return this.subscribe(this.wsURL, msg);
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
                            eventTime: Date.now(),
                            ename: this.#name,
                            exchange: 'bybit',
                            clientOrderId: item.order_link_id,
                            orderId: item.order_id,
                            side:item.side.toLowerCase(),
                            type:item.order_type.toLowerCase(),
                            status: item.order_status.toUpperCase(),
                            executedQty: item.cum_exec_qty,
                            quoteQty: item.cum_exec_value,
                            updateTime: null,
                            rawData: pl
                        }
                        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_FUTURE_OR_UPDATE`, upData);
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
                ws.send(JSON.stringify({ping:Date.now()}));
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if('pong' in pl){
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                }else{
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
                    logger.error(`bybit future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('bybit future privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('bybit future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`bybit future privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}