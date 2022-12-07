const {axios, Websocket, events, logger, dataCalculation} = require("../../../../utils/utils");
const {createHmac} =require('crypto');

class PrivateSocekt{

    #apiKey='';
    #secretKey='';

    constructor(apiKey,secretKey, endpoint, socketUrl, timeout) {
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new events();
    }

    updateStatus(status, remainingSize, quantity){
        let order_status = 'NEW';
        let size = parseFloat(remainingSize);
        if(status === 'open'){
            order_status = 'PARTIALLY_FILLED';
        }else  if(status === 'closed' && size === 0){
            order_status = 'FILLED';
        }else if(status === 'closed' && size < quantity){
            order_status = 'EXPIRED';
        } else{
            order_status = 'NEW';
        }
        return order_status;
    }

    async orderStateUpdate(){
        let ts =  Date.now()
        let presigned = `${ts}websocket_login`;
        let sign =  createHmac('sha256',this.#secretKey).update(presigned).digest('hex');
        let authMsg = {
            agrs:{
                key: this.#apiKey,
                sign: sign,
                time: ts,
            },
            op: "login"
        }
        let msg = {'op': 'subscribe', 'channel': 'orders'};
        return this.subscribe(this.wsURL, {
            authMsg: authMsg,
            msg:msg,
        })


    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.channel;
        switch (e_type){
            case 'orders':
                let status = this.updateStatus(pl.data.status, pl.data.remainingSize, pl.data.size);
                let updata = {
                    eventType: 'executionReport',
                    eventTime: Math.ceil(pl.data.time * 1000),
                    ename: 'ftx',
                    clientOrderId: pl.data.clientId,
                    orderId:  pl.data.id,
                    side: pl.data.side.toLowerCase(),
                    type: pl.data.type.toLowerCase(),
                    status: status,
                    executedQty:pl.data.filledSize,
                    quoteQty: dataCalculation(pl.data.filledSize, pl.data.avgFillPrice, '*'),
                    updateTime: '',
                    rawData: pl
                }
                this.orderStateUpdateEE.emit('FTX_FUTURE_OR_UPDATE', updata);
                break;
        }
    }

    subscribe (url, data) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws
            ws.on('open', ()=>{
                ws.send(JSON.stringify(data.authMsg));
                ws.send(JSON.stringify(data.msg));
                wsRef.unMsg = data.msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.channel === 'orders') {
                    this.dataFormat(JSON.stringify(pl));
                }else{
                    logger.debug(`ftx.spot.socket.private.upOrders.status:${JSON.stringify(pl)}`)
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
                    logger.error(`ftx future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('ftx future privateSockete rconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('ftx future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`ftx future privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}