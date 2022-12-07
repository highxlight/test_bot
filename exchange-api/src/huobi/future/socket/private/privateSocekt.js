const { Websocket, events, logger, zlib} = require("../../../../utils/utils");
const {createHmac} = require('crypto')

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name='';

    constructor(name, apiKey,secretKey, endpoint, socketUrl) {
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.endpoint = endpoint,
        this.wsURL = socketUrl+ '-notification';
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    updateStatus(status) {
        let order_status = 'NEW';
        switch (status) {
            case 3:
                order_status = 'NEW';
                break;
            case 4:
                order_status = 'PARTIALLY_FILLED';
                break;
            case 5:
                order_status = 'EXPIRED';
                break;
            case 6:
                order_status = 'FILLED';
                break;
            case 7:
                order_status = 'CANCELED';
                break;
            case 11:
                order_status = 'PENDING_CANCEL';
                break;
            default:
                order_status = 'REJECTED';
                break
        }
        return order_status;
    }

    // 认证
    requestAuth(){
        try{
            let timestamp = new Date().toISOString().replace(/\..+/, '');
            let authMsg ={
                op: "auth",
                type: "api",
                AccessKeyId: this.#apiKey,
                SignatureMethod: "HmacSHA256",
                SignatureVersion: "2",
                Timestamp: timestamp,
                Signature: "",
            }
            let reqUrl =this.endpoint.replace('https://','');
            let signStr =`GET\n${reqUrl}\n/linear-swap-notification\nAccessKeyId=${this.#apiKey}&SignatureMethod=HmacSHA256&SignatureVersion=2.1&Timestamp=${encodeURIComponent(timestamp)}`;
            let sign = createHmac('sha256',this.#secretKey).update(signStr).digest('base64');
            authMsg.Signature = encodeURIComponent(sign);
            return authMsg;
        }catch (err) {
            logger.error(`huobi.future.socket.private.auth.err:${err.message}`)
        }
    }

    async orderStateUpdate(){
        let url = `${this.wsURL}`;
        let msg = {
            op: "sub",
            topic: "trade.orders_cross.*"
        }
        return this.subscribe(url, msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.op;
        switch (e_type){
            case 'notify':
                try {
                    let upData={
                        eventType: 'executionReport',
                        eventTime: pl.tradeTime,
                        ename: this.#name,
                        exchange: 'huobi',
                        clientOrderId: pl.client_order_id,
                        orderId: pl.order_id,
                        side: pl.direction.toLowerCase(),
                        type: pl.order_price_type,
                        status: this.order_status(pl.status),
                        executedQty :pl.trade_volume,
                        quoteQty: pl.trade_turnover,
                        updateTime: pl.tradeTime,
                        rawData: pl
                    }
                    this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_FUTURE_OR_UPDATE`, upData);
                }catch (err){
                    logger.error(`gateio.future.socket.private.upOrder.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
                let authMsg = this.requestAuth()
                ws.send(JSON.stringify(authMsg));
            })
            ws.on('message', (data)=>{
                const result = Buffer.from(zlib.gunzipSync(data));
                const pl = JSON.parse(result.toString());
                if(pl.op === 'ping'){
                    let pingMsg = {
                        op: 'pong',
                        ts: pl.ts
                    }
                    ws.send(JSON.stringify(pingMsg));
                }else if(pl.topic === 'trade.orders_cross.*'){
                    this.dataFormat(JSON.stringify(pl));
                }else if(pl.op === 'auth' && pl["err-code"] === 0){
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                }else{
                    logger.debug(`huobi.future.socket.private.message: ${JSON.stringify(pl)}`)
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
                    logger.error(`huobi future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('huobi future privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('huobi future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsub';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`huobi future privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}