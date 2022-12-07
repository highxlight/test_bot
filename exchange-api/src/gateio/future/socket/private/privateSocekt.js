const { Websocket, events, logger, dataCalculation} = require("../../../../utils/utils");
const {createHmac} = require('crypto')

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name='';

    constructor(name, apiKey,secretKey, endpoint, socketUrl) {
        this.#name= name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    updateStatus(finish_as, status){
        let order_status = 'NEW';
        if(finish_as === 'ioc'){
            order_status = 'NEW';
        }else if(finish_as === 'filled'){
            order_status = 'FILLED';
        }else if(finish_as === 'cancelled'){
            order_status = 'CANCELED';
        }else {
            if(status === 'finished') {
                order_status = 'EXPIRED';
            }
        }
        return order_status;
    }

    async orderStateUpdate(){
        let url = `${this.wsURL}`;
        let msg = {
            time:Math.ceil(Date.now()/ 1000),
            channel: "futures.orders",
            event: "subscribe",
            payload: ['!all'],
            auth: {
                method: 'api_key',
                KEY: this.#apiKey,
                SIGN: ''
            }
        }
        let signStr = `channel=${msg.channel}&event=${msg.event}&time=${msg.time}`;
        let sign = createHmac('sha512',this.#secretKey).update(signStr).digest('hex');
        msg.auth.SIGN = sign;
        return this.subscribe(url, msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.channel;
        switch (e_type){
            case 'futures.orders':
                try {
                    pl.result.forEach(item=>{
                        let order_type = 'limit';
                        if(item.price === 0 && item.tif === 'ioc'){
                            order_type = 'market';
                        }
                        let upData={
                            eventType: 'executionReport',
                            eventTime:parseInt(pl.time) * 1000,
                            ename: this.#name,
                            exchange: 'gateio',
                            clientOrderId: item.text,
                            orderId: item.id,
                            side: parseFloat(item.size) < 0 ? 'sell' : 'buy',
                            type:order_type,
                            status: this.updateStatus(item.finish_as, item.status),
                            executedQty:  dataCalculation(Math.abs(item.size), item.left, '-'),
                            quoteQty:item.fill_price,
                            updateTime: item.finish_time_ms,
                            rawData: pl
                        }
                        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_FUTURE_OR_UPDATE`, upData);
                    })
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
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.event === 'update'){
                    this.dataFormat(JSON.stringify(pl));
                }else if('error' in pl){
                    logger.debug(`gateio.future.socket.private.error: ${JSON.stringify(pl.error)}`);
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
                    logger.error(`gateio future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('gateio future privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('gateio future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.event = 'unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`gateio future privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}