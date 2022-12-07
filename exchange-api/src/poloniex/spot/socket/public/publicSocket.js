const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}_${tsym}`
        let msg = { "command": "subscribe", "channel": symbol };
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let e_type = '';
        if('orderBook' in payload[1]){
            e_type =  'orderBook';
        }
        switch (e_type){
            case "orderBook":
                let pairs = payload[1]['currencyPair'].split('_');
                let asks = [], bids = [];
                let ask = payload[1]['orderBook'][0];
                let bid = payload[1]['orderBook'][1];
                for (let key  in ask){
                    let lista = [key, ask[key]];
                    asks.push(lista);
                }
                for (let key  in bid){
                    let lista = [key, bid[key]];
                    bids.push(lista);
                }
                let orderBookData = {
                    eventType: 'depthUpdate',
                    eventTime: payload[2],
                    ename: 'poloniex',
                    fsym: pairs[0],
                    tsym: pairs[1],
                    symbol: payload[1]['currencyPair'],
                    asks: asks,
                    bids: bids,
                    rawData: payload
                }
                this.symbolOrderBookEE.emit('POLONIEX_OB_UPDATES', orderBookData);
                break;
        }
    }

    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            try{
                const ws = new Websocket(url)
                wsRef.ws = ws
                ws.on('open', ()=>{
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    const pl = JSON.parse(data);
                    if(pl.length > 2){
                        let result = pl[2];
                        result.forEach(item=>{
                            if(item[0] === 'i'){
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
                        logger.error(`poloniex spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('poloniex spot publicSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`poloniex.public.socket.error:${err.message}`)
            }
        }
        logger.debug(url)
        initConnect()
        return wsRef


    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) {
            logger.warn('poloniex spot publicSocket no connection to close.')
        }else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`poloniex spot publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}