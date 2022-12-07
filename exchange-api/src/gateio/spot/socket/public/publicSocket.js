const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events;
    }

    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}_${tsym}`;
        let msg = {
            time: Math.ceil(Date.now()/ 1000),
            channel: "spot.candlesticks",
            event: "subscribe",
            payload: [interval, symbol]
        }
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}_${tsym}`;
        let msg = {
            time:Math.ceil(Date.now()/ 1000),
            channel: "spot.order_book_update",
            event: "subscribe",
            payload: [symbol, "1000ms"]
        }
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.channel;
        switch (e_type){
            case "spot.candlesticks":
                try {
                    let pairList = pl.result.n.split('_');
                    let klineData = {
                        eventType: 'kline',
                        eventTime:pl.time,
                        ename: 'gateio',
                        fsym: pairList[1],
                        tsym: pairList[2],
                        symbol: `${pairList[1]}_${pairList[2]}`,
                        kline:{
                            startTime: parseInt(pl.result.t) * 1000 ,
                            endTime: '',
                            interval: pairList[0],
                            openPrice: pl.result.o,
                            closePrice: pl.result.c,
                            highPrice:pl.result.h,
                            lowPrice:pl.result.l,
                            executedQty: pl.result.v,
                            quoteVolume: ''
                        },
                        rawData: pl
                    }
                    this.symbolKlineEE.emit('GATEIO_KL_UPDATE', klineData);
                }catch (err) {
                    logger.error(`gateio.spot.socket.public.kline.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
            case "spot.order_book_update":
                try{
                    let pairList = pl.result.s.split('_');
                    let ask = pl.result.a.sort();
                    let bid = pl.result.b.sort();
                    let asks = [];
                    let bids = [];
                    ask.forEach(item=>{
                        if(item[1] !== '0'){
                            asks.push(item);
                        }
                    })
                    bid.forEach(item=>{
                        if(item[1] !== '0'){
                            bids.push(item);
                        }
                    })
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime:parseInt(pl.time) * 1000,
                        ename: 'gateio',
                        fsym: pairList[0],
                        tsym: pairList[1],
                        symbol: pl.result.s,
                        asks: asks,
                        bids: bids.reverse(),
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('GATEIO_OB_UPDATES', orderBookData);
                }catch (err) {
                    logger.error(`gateio.spot.socket.public.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
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
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.event === 'update'){
                    this.dataFormat(JSON.stringify(pl));
                }else if('error' in pl){
                    logger.debug(`gateio spot socketio error: ${JSON.stringify(pl.error)}`);
                }else if(pl.result.status !== 'success') {
                    ws.send(JSON.stringify(msg));
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
                    logger.error(`gateio spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('gateio spot publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('gateio spot publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.event =  "unsubscribe";
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`gateio spot publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}