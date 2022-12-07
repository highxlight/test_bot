const {Websocket, timeFormat, randString, dataCalculation, events, logger} = require("../../../../utils/utils");
const {createHmac} =require('crypto');

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name ='';

    constructor(name, apiKey, secretKey, endpoint, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }
    updateStatusData(status){
        let orderStatus = 'NEW';
        switch (status){
            case 'open':
                orderStatus = 'NEW';
                break;
            case 'filled':
                orderStatus = 'FILLED';
                break;
            case 'rejected':
                orderStatus = 'REJECTED';
                break;
            case 'cancelled':
                orderStatus = 'CANCELED';
                break;
            case 'untriggered':
                orderStatus = 'NEW';
                break;
        }
        return orderStatus;
    }

    async orderStateUpdate(){
        let msg = {
            "jsonrpc": "2.0",
            "method": "private/subscribe",
            "params" : {
                "channels": ["user.orders.future.any.raw"]
            }
        };
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let result = JSON.parse(payload) ;
        if('data' in result.params){
            let pl  = result.params.data
            let upData={
                eventType: 'executionReport',
                eventTime: timeFormat(pl.last_update_timestamp),
                ename: this.#name,
                exchange:'deribit',
                clientOrderId: pl.label,
                orderId: pl.order_id,
                side: pl.direction,
                type: pl.order_type,
                status: this.updateStatusData(pl.order_state),
                executedQty: pl.filled_amount,
                quoteQty: dataCalculation(pl.average_price, pl.filled_amount, '*'),
                updateTime: timeFormat(pl.last_update_timestamp),
                rawData: result
            }
            this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_FUTURE_OR_UPDATE`, upData);
        }
    }


    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws
            ws.on('open', ()=>{
                let timestamp = Date.now();
                let nonce=randString(6);
                let data = '';
                let presigned = `${timestamp}\n${nonce}\n${data}`;
                let sign = createHmac('sha256',this.#secretKey).update(presigned).digest('hex');
                let authMsg = {
                    "jsonrpc": "2.0",
                    "method": "public/auth",
                    "params" : {
                        timestamp:timestamp,
                        grant_type : "client_signature",
                        client_id : this.#apiKey,
                        client_secret : this.#secretKey,
                        nonce: nonce,
                        data: '',
                        signature:sign
                    }
                }
                ws.send(JSON.stringify(authMsg))
            })

            ws.on('message', (data)=>{
                if(data !== 'pong'){
                    const pl = JSON.parse(data);
                    if('error' in pl){
                        logger.info(`deribit.futrue.public.socket.error:${JSON.stringify(pl)}`)
                        if(pl.id !== 'unsubscribe'){
                            ws.send(JSON.stringify(msg))
                        }
                    }else if('params' in pl){
                        this.dataFormat(JSON.stringify(pl));
                    }else if(pl.result.refresh_token){
                        ws.send(JSON.stringify(msg));
                        wsRef.unMsg = msg;
                    }else{
                        logger.info(`deribit.futrue.public.socket.info:${JSON.stringify(pl)}`)
                    }
                }
                setInterval(()=>{
                    ws.send('ping');
                }, 5000)
            })

            ws.on('error', err => {
                logger.error(err)
            })

            ws.on('close', (closeEventCode, reason) => {
                if (!wsRef.closeInitiated) {
                    logger.error(`deribit future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('deribit future privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('deribit future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.method = 'private/unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg))
            }catch (err){
                logger.error(`deribit future privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}