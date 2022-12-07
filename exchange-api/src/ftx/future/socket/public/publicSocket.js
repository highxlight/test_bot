const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolOrderBookEE = new events();
    }
    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}-${tsym}`;
        let url = `${this.wsURL}`;
        let msg ={'op': 'subscribe', 'channel': 'orderbook', 'market': symbol.toUpperCase()}
        return this.subscribe(url, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.channel;
        switch (e_type){
            case "orderbook":
                let pairList = pl.market.split('-');
                var tsym = '';
                pairList.forEach((item, key)=>{
                    if(item !== pairList[0] ){
                        if(key < pairList.length-1){
                            tsym += `${item}-`
                        }else{
                            tsym += `${item}`
                        }
                    }
                })
                let orderBookData = {
                    eventType: 'depthUpdate',
                    eventTime: Math.ceil(pl.data.time * 1000),
                    ename: 'ftx',
                    fsym: pairList[0],
                    tsym: tsym,
                    symbol: pl.market,
                    asks: pl.data.asks,
                    bids: pl.data.bids,
                    rawData: pl
                }
                this.symbolOrderBookEE.emit('FTX_FUTURE_OB_UPDATES', orderBookData);
                break;
        }
    }

    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws;
            ws.on('open', ()=>{
                wsRef.timer = setInterval(()=>{
                    try {
                        ws.send(JSON.stringify({'op': 'ping'}))
                    }catch (err){
                        logger.error(`ftx.future.public.ping.err: ${err.message}`)
                    }
                }, 15000)
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.type === 'partial'){
                    this.dataFormat(JSON.stringify(pl));
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
                    logger.error(`ftx future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('ftx future publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('ftx future publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg))
            }catch (err) {
                logger.error(`ftx future publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}