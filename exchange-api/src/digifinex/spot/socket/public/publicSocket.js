const {Websocket, events, logger, zlib} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}_${tsym}`;
        var msg = {
            id: Date.now(),
            method:"depth.subscribe",
            params:[symbol]
        }
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.method;
        switch (e_type){
            case "depth.update":
                try{
                    let paris = pl.params[2].split('_');
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime: pl.sendTime,
                        ename: 'digifinex',
                        fsym:  paris[0],
                        tsym: paris[1],
                        symbol: pl.params[2],
                        asks: pl.params[1].asks.reverse(),
                        bids: pl.params[1].bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('DIGIFINEX_OB_UPDATES', orderBookData);
                }catch (err) {
                    logger.error(`digifinex.spot.socket.public.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
            ws.on("open", ()=>{
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const result = zlib.unzipSync(data).toString('utf-8');
                const pl = JSON.parse(result.toString());
                if(pl.method === 'depth.update'){
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
                    logger.error(`digifinex spot publicSocket onnection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('digifinex spot publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('digifinex spot publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.method = 'depth.unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`digifinex spot publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}