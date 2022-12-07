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
        this.endpoint = endpoint,
        this.wsURL = socketUrl+ '/v2';
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    updateStauts(status){
        let order_status = 'NEW';
        switch (status) {
            case 'created':
                order_status = 'NEW';
                break;
            case 'submitted':
                order_status = 'NEW';
                break;
            case 'partial-filled':
                order_status = 'PARTIALLY_FILLED';
                break;
            case 'filled':
                order_status = 'FILLED';
                break;
            case 'partial-canceled':
                order_status = 'EXPIRED';
                break;
            case 'canceling':
                order_status = 'PENDING_CANCEL';
                break;
            case 'canceled':
                order_status = 'CANCELED';
                break;
        }
        return order_status;
    }

    // 认证
    requestAuth(){
        try{
            let timestamp = new Date().toISOString().replace(/\..+/, '');
            let authMsg = {
                action: "req",
                ch: "auth",
                params: {
                    authType:"api",
                    accessKey: this.#apiKey,
                    signatureMethod: "HmacSHA256",
                    signatureVersion: "2.1",
                    timestamp: timestamp,
                    signature: ''
                }
            }
            let reqUrl =this.endpoint.replace('https://','');
            let signStr =`GET\n${reqUrl}\n/ws/v2\naccessKey=${this.#apiKey}&signatureMethod=HmacSHA256&signatureVersion=2.1&timestamp=${encodeURIComponent(timestamp)}`;
            let sign = createHmac('sha256',this.#secretKey).update(signStr).digest('base64');
            authMsg.params.signature = sign;
            return authMsg;
        }catch (err) {
            logger.error(`huobi.spot.socket.private.auth.err:${err.message}`)
        }
    }

    async orderStateUpdate(){
        let msg = {
            action: "sub",
            ch: "trade.clearing#*"
        }
        return this.subscribe(this.wsURL, msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.ch;
        switch (e_type){
            case 'trade.clearing#*':
                try {
                    let item = pl.data;
                    let upData={
                        eventType: 'executionReport',
                        eventTime: item.tradeTime,
                        ename:this.#name,
                        exchange: 'huobi',
                        clientOrderId: item.clientOrderId,
                        orderId: item.orderId,
                        side:item.orderSide.toLowerCase(),
                        type: null,
                        status: this.updateStauts(item.orderStatus),
                        executedQty:item.tradeVolume,
                        quoteQty:item.tradePrice,
                        updateTime: item.tradeTime,
                        rawData: pl
                    }
                    this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
                }catch (err){
                    logger.error(`gateio.spot.socket.private.upOrder.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
                const pl = JSON.parse(data);
                if(pl.action === 'ping'){
                    let pingMsg = {
                        action: 'pong',
                        data:{
                            ts: pl.data.ts
                        }
                    }
                    ws.send(JSON.stringify(pingMsg));
                }else if(pl.ch === 'orders#*'){
                    this.dataFormat(JSON.stringify(pl));
                }else if(pl.ch === 'auth' && pl.code === 200){
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                }else{
                    logger.debug(`huobi.spot.socket.private.message: ${JSON.stringify(pl)}`)
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
                    logger.error(`huobi spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('huobi spot privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('huobi spot privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.action = 'unsub';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`huobi spot privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}