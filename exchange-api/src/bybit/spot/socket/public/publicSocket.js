const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}/quote/ws/v1`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }
    async symbolKline({fsym, tsym, interval}){
        let symbol = `${fsym}${tsym}`;
         var msg = {
            "topic": 'kline_'+ interval,
            "event": "sub",
            "symbol": symbol,
            "params": {
                "binary": false
            }
        }
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`;
        var msg = {
            "topic": "depth",
            "event": "sub",
            "symbol":symbol,
            "params": {
                "binary": false
            }
        }
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.topic;
        switch (e_type){
            case "kline":
                try {
                    pl.data.forEach(item=>{
                        let klineData={
                            eventType: 'kline',
                            eventTime: pl.sendTime,
                            ename: 'bybit',
                            fsym: null,
                            tsym: null,
                            symbol:pl.symbol,
                            kline:{
                                startTime: item.t,
                                endTime: '',
                                Interval: pl.params.klineType,
                                openPrice: item.o,
                                closePrice: item.c,
                                highPrice:item.h,
                                lowPrice: item.l,
                                executedQty: item.v,
                                quoteVolume: null
                            },
                            rawData: pl
                        }
                        this.symbolKlineEE.emit('BYBIT_KL_UPDATE', klineData);
                    })
                }catch (err) {
                    logger.error(`bybit.spot.socket.public.kline.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
            case "depth":
                try{
                    if(pl.data.length > 0 ){
                        let orderBookData = {
                            eventType: 'depthUpdate',
                            eventTime: pl.sendTime,
                            ename: 'bybit',
                            fsym:  null,
                            tsym: null,
                            symbol: pl.symbol,
                            asks: pl.data[0].a,
                            bids: pl.data[0].b,
                            rawData: pl
                        }
                        this.symbolOrderBookEE.emit('BYBIT_OB_UPDATES', orderBookData);
                    }
                }catch (err) {
                    logger.error(`bybit.spot.socket.public.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
                wsRef.timer = setInterval(()=>{
                    try {
                        ws.send(JSON.stringify({ping:Date.now()}));
                    }catch (err){
                        logger.error(`bybit.spot.public.ping.err: ${err.message}`)
                    }
                }, 30000)
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if('topic' in pl){
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
                    logger.error(`bybit spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('bybit spot publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('bybit spot publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.event = 'cancel';
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`bybit spot publicSocket no connection to close.err:${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}