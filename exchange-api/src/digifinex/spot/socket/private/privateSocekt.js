const { Websocket, events, logger, zlib, dataCalculation} = require("../../../../utils/utils");
const {createHmac} = require('crypto')

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name='';

    constructor(name, apiKey,secretKey, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }
    upOrderStatus(status){
        let orderStatus = 'NEW';
        switch (status) {
            case 0:
                orderStatus = 'NEW';
                break;
            case 1:
                orderStatus = 'PARTIALLY_FILLED';
                break;
            case 2:
                orderStatus = 'FILLED';
                break;
            case 3:
                orderStatus = 'CANCELED';
                break;
            case 4:
                orderStatus = 'EXPIRED';
                break;
        }
        return orderStatus;
    }
    async orderStateUpdate(){
        let timestamp = Date.now().toString();
        let sign = createHmac('sha256', this.#secretKey).update(timestamp).digest('base64');
        let authMsg = {
            id: Date.now(),
            method:'server.auth',
            params:[this.#apiKey, timestamp, sign]
        }
        let msg = {"id": Math.floor(Date.now() / 1000), "method":"order.subscribe", "params":["all"]}
        return this.subscribe(this.wsURL, authMsg,  msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.method;
        switch (e_type){
            case 'order':
                try {
                    pl.params.forEach(item=>{
                        let upData={
                            eventType: 'executionReport',
                            eventTime: item.timestamp,
                            ename: this.#name,
                            exchange: 'digifinex',
                            clientOrderId: null,
                            orderId: item.id,
                            side:item.side.toLowerCase(),
                            type:item.type.toLowerCase(),
                            status: this.upOrderStatus(item.status),
                            executedQty:item.filled,
                            quoteQty: dataCalculation(item.price_avg, item.filled, '*'),
                            updateTime: item.timestamp,
                            rawData: pl
                        }
                        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
                    })
                }catch (err){
                    logger.error(`digifinex.spot.socket.private.upOrder.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
        }
    }


    subscribe (url, authMsg, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws
            ws.on('open', ()=>{
                ws.send(JSON.stringify(authMsg));
            })
            ws.on('message', (data)=>{
                const result = zlib.unzipSync(data).toString('utf-8');
                const pl = JSON.parse(result);
                if(pl.error === null){
                    if( pl.result.status === 'success' && pl.id === authMsg.id){
                        ws.send(JSON.stringify(msg));
                        wsRef.unMsg = msg;
                    }else if(plcmethod === 'order.update'){
                        this.dataFormat(JSON.stringify(pl));
                    }
                }else{
                    console.log(`digifinex.spot.socket.privateSocket.err:${pl.error}`);
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
                    logger.error(`digifinex spot privateSocket Connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('digifinex spot privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('digifinex spot privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'order.unsubscribe';
                objRef.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`digifinex spot privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}