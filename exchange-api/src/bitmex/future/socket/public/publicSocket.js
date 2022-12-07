const {Websocket, timeFormat, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolOrderBookEE = new events();
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`;
        let msg = {"op": "subscribe", "args": [`orderBook10:${symbol}`]}
        return this.subscribe(this.wsURL, msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.table;
        switch (e_type){
            case "orderBook10":
                try {
                    pl.data.forEach(item=>{
                        let orderBookData = {
                            eventType: 'depthUpdate',
                            eventTime: timeFormat(item.timestamp),
                            ename: 'bitmex',
                            fsym: null,
                            tsym: null,
                            symbol: item.symbol,
                            asks: item.asks,
                            bids: item.bids,
                            rawData: pl
                        }
                        this.symbolOrderBookEE.emit('BITMEX_FUTURE_OB_UPDATES', orderBookData);
                    })
                }catch (err){
                    logger.error(`bitmex.future.socket.public.orderBook.err: ${err.message}, pl: ${JSON.stringify(pl)} `)
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
                wsRef.timer = setInterval(()=>{
                    try {
                        ws.send('ping');
                    }catch (err){
                        logger.error(`bitmex.future.public.ping.err: ${err.message}`)
                    }
                }, 5000)
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                if(data !== 'pong'){
                    const pl = JSON.parse(data);
                    if('data' in pl){
                        this.dataFormat(JSON.stringify(pl));
                    }else{
                        logger.info(`bitmex.future.public.socket:${JSON.stringify(pl)}`);
                    }
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
                    logger.error(`bitmex future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('bitmex future publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('bitmex future publicSocket no connection to close.')
        else {
            objRef.unMsg.op = 'unsubscribe';
            clearInterval(objRef.timer);
            objRef.ws.send(JSON.stringify(objRef.unMsg));
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}

module.exports = {PublicSocket}