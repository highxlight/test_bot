const {Websocket, events, logger, dataCalculation} = require("../../../../utils/utils");
const {createHmac} = require('crypto');


class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #passphrase='';
    #name = '';

    constructor(name, apiKey,secretKey,passphrase, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.wsURL = `${socketUrl}/private`;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    loign(){
        let endpoint =`/users/self/verify`;
        let timestamp = Date.now() / 1000;
        let presigned = `${timestamp}GET${endpoint}`;
        let sign = createHmac('sha256',this.#secretKey).update(presigned).digest('base64');
        let msg = {
            op: "login",
            args:[{
                apiKey: this.#apiKey,
                passphrase: this.#passphrase,
                timestamp: timestamp,
                sign: sign
            }]
        }
        return {msg: msg, url:this.wsURL}

    }

    updateStatus(stauts){
        let order_status = 'NEW';
        switch (stauts){
            case 'live':
                order_status = 'NEW';
                break;
            case 'canceled':
                order_status = 'CANCELED';
                break;
            case 'partially_filled':
                order_status = 'PARTIALLY_FILLED';
                break;
            case 'filled':
                order_status = 'FILLED';
                break;
        }
        return order_status;
    }

    async orderStateUpdate(){
        let data =  this.loign();
        let subscribeMsg = {
            event: "subscribe",
            arg: {
                channel: "orders",
                instType: "SPOT"
            }
        }
        data.subscribeMsg = subscribeMsg;
        return this.subscribe(data)
    }

    dataFormat(payload){
        let results = payload;
        results.forEach(item=>{
            let upData={
                eventType: 'executionReport',
                eventTime: Date.now(),
                ename: this.#name,
                exchange: 'okex',
                clientOrderId: item.clOrdId,
                orderId: item.ordId,
                side: item.side,
                type: item.ordType,
                status: this.updateStatus(item.state),
                executedQty:item.accFillSz,
                quoteQty: dataCalculation(item.accFillSz, item.avgPx, '*'),
                updateTime: item.uTime,
                rawData: item.cTime
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
                    ws.send(JSON.stringify(params.msg))
                })
                ws.on('message', (data)=>{
                    if(data !== 'pong'){
                        const pl = JSON.parse(data);
                        if('event' in pl){
                            if(pl.event === 'login' && pl.code === '0'){
                                ws.send(JSON.stringify(params.subscribeMsg));
                                wsRef.unMsg = params.subscribeMsg;
                            }else if(pl.event === 'unsubscribe'){
                                logger.info(`okex.private.socket.unsubscribe.success:${JSON.stringify(pl)}`);
                            }else if(pl.event === 'error'){
                                ws.send(JSON.stringify(params.msg));
                                logger.error(`okex.private.socket.err: ${JSON.stringify(pl)}`)
                            }
                        }else if('data' in pl){
                            this.dataFormat(pl.data);
                        }
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })
                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`okex spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('okex spot privateSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`okex.private.socket.error:${err.message}`)
            }

        }
        logger.debug(params.url);
        initConnect();
        return wsRef
    }

    unsubscribe (objwsRef) {
        if (!objwsRef || !objwsRef.ws) {
            logger.warn('okex spot privateSocket no connection to close.')
        }else {
            try {
                objwsRef.unMsg.op = "unsubscribe";
                objwsRef.ws.send(JSON.stringify(objwsRef.unMsg));
            }catch (err){
                logger.error(`okex spot privateSocket no connection to close.err: ${err.message}`)
            }
            objwsRef.closeInitiated = true
            objwsRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}