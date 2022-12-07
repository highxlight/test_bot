const {Websocket, events, logger} = require("../../../../utils/utils");
const {createHash} = require('crypto');


class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name='';

    constructor(name, apiKey, secretKey, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = `${socketUrl}`;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    loign(){
        let timestamp = Date.now();
        let presigned = `access_id=${this.#apiKey}&tonce=${timestamp}&secret_key=${this.#secretKey}`;
        let sign = createHash('md5').update(presigned).digest('hex').toUpperCase()
        let msg ={
            "method": "server.sign",
            "params": [
                this.#apiKey,
                sign,
                timestamp
            ],
            "id": timestamp,
        }
        return {msg: msg, url:this.wsURL}

    }

    async orderStateUpdate(){
        let data =  this.loign();
        let subscribeMsg = {
            method: "order.subscribe",
            params: ['all'],
            id: Date.now()
        }
        data.subscribeMsg = subscribeMsg;
        return this.subscribe(data)
    }

    dataFormat(payload){
        let results = payload.params;
        results[2].forEach(item=>{
            var status  = 'NEW';
            if(results[0] === 2){
                status = 'PARTIALLY_FILLED'
            }else if(item.left === 0 && results[0] === 3){
                status = 'FILLED'
            }else if(item.left === item.amount &&  results[0] === 3){
                status = 'REJECTED'
            }
            let upData={
                eventType: 'executionReport',
                eventTime: Math.floor(item.mtime * 1000),
                ename: this.#name,
                exchange: 'coinex',
                clientOrderId: item.client_id,
                orderId: item.id,
                side: item.side === 1 ? 'sell' : item.side === 2 ? 'buy' : item.side,
                type: item.type === 1 ? 'limit' : item.type === 2 ? 'market' : item.type,
                status: status,
                executedQty:item.deal_money,
                quoteQty: item.deal_stock,
                updateTime: Math.floor(item.mtime * 1000),
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
                    let pl = JSON.parse(data);
                    if(pl.error !== null){
                        logger.error(`coinex.spot.socket.private.error: ${JSON.stringify(pl)}`);
                    }else if(params.msg.id ===  pl.id){
                        if(pl.result.status){
                            ws.send(JSON.stringify(params.subscribeMsg));
                            wsRef.unMsg = params.subscribeMsg;
                        }
                    }else if(pl.method === 'order.update'){
                        this.dataFormat(pl);
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })
                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`coinex spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('coinex spot privateSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`coinex.private.socket.error:${err.message}`)
            }

        }
        logger.debug(params.url);
        initConnect();
        return wsRef
    }

    unsubscribe (objwsRef) {
        if (!objwsRef || !objwsRef.ws) {
            logger.warn('coinex spot privateSocket no connection to close.')
        }else {
            try {
                objwsRef.unMsg.method = "order.unsubscrib";
                objwsRef.ws.send(JSON.stringify(objwsRef.unMsg));
            }catch (err){
                logger.error(`coinex spot privateSocket no connection to close.err: ${err.message}`)
            }
            objwsRef.closeInitiated = true
            objwsRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}