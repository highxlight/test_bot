const {Websocket, events, logger} = require("../../../../utils/utils");
const {createHmac} = require('crypto');


class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name = '';

    constructor(name, apiKey, secretKey, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    updateStatus(stauts, amount){
        let order_status = 'NEW';
        switch (stauts.toLowerCase()){
            case 'f':
                if(parseFloat(amount) > 0){
                    order_status = 'PARTIALLY_FILLED'
                }
                if(parseFloat(amount) === 0){
                    order_status = 'FILLED'
                }
                break;
            case 'c':
                if(parseFloat(amount) > 0){
                    order_status = 'EXPIRED'
                }
                if(parseFloat(amount) === 0){
                    order_status = 'CANCELED'
                }
                break;
            case 's':
                order_status = 'EXPIRED';
                break;
        }
        return order_status;
    }

    async orderStateUpdate(){
        let timestamp = Date.now();
        let sign = createHmac('sha512', this.#secretKey).update(`nonce=${timestamp}`).digest('hex');
        let msg = {
            command: 'subscribe',
            channel: 1000,
            sign: sign,
            key: this.#apiKey,
            payload:`nonce=${timestamp}`
        }
        return this.subscribe(this.wsURL, msg);
    }

    dataFormat(payload){
        let results = payload;
        let upData={
            eventType: 'executionReport',
            eventTime: null,
            ename: this.#name,
            exchange: 'poloniex',
            clientOrderId: results[4],
            orderId: results[1],
            side: null,
            type: null,
            status: this.updateStatus(results[3], results[2]),
            executedQty: null,
            quoteQty: null,
            updateTime: null,
            rawData: payload
        }
        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
    }


    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            try{
                const ws = new Websocket(url);
                ws.on('open', ()=>{
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    const pl = JSON.parse(data);
                    console.log(JSON.stringify(pl))
                    if(pl[0] === 1000 && pl[1] === null &&  pl[2].length > 0){
                        let result = pl[2];
                        result.forEach(item=>{
                            if(item[0] === 'o'){
                                this.dataFormat(item);
                            }
                        })
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })
                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`poloniex spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('poloniex spot privateSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`poloniex.private.socket.error:${err.message}`)
            }

        }
        logger.debug(url);
        initConnect();
        return wsRef
    }

    unsubscribe (objwsRef) {
        if (!objwsRef || !objwsRef.ws) {
            logger.warn('poloniex spot privateSocket no connection to close.')
        }else {
            try {
                objwsRef.unMsg.op = "unsubscribe";
                objwsRef.ws.send(JSON.stringify(objwsRef.unMsg));
            }catch (err){
                logger.error(`poloniex spot privateSocket no connection to close.err: ${err.message}`)
            }
            objwsRef.closeInitiated = true
            objwsRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}