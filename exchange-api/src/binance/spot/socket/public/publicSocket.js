const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}/ws`;
        this.reconnectDelay = 18000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events;
    }

    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}${tsym}`;
        var msg = {
            method: "SUBSCRIBE",
            params:[`${symbol.toLowerCase()}@kline_${interval}`],
            id: Date.now()
        }
        return this.subscribe(this.wsURL, msg);
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`;
        var msg = {
            method: "SUBSCRIBE",
            params:[`${symbol.toLowerCase()}@depth@1000ms`],
            id: Date.now()
        }
        return this.subscribe(this.wsURL, msg);
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        if('data' in pl){
            pl = pl.data;
        }
        let e_type = pl.e;
        switch (e_type){
            case "kline":
                let klineData = {
                    eventType: 'kline',
                    eventTime:pl.E,
                    ename: 'binance',
                    fsym: null,
                    tsym: null,
                    symbol: pl.s,
                    kline:{
                        startTime: pl.k.t,
                        endTime: pl.k.T,
                        interval: pl.k.i,
                        openPrice: pl.k.o,
                        closePrice: pl.k.c,
                        highPrice:pl.k.h,
                        lowPrice:pl.k.l,
                        executedQty: pl.k.v,
                        quoteVolume: pl.k.q
                    },
                    rawData: pl
                }
                this.symbolKlineEE.emit('BINANCE_KL_UPDATE', klineData);
                break;
            case "depthUpdate":
                let orderBookData = {
                    eventType: 'depthUpdate',
                    eventTime:pl.E,
                    ename: 'binance',
                    fsym: null,
                    tsym: null,
                    symbol:pl.s,
                    asks: pl.a,
                    bids: pl.b,
                    rawData: pl
                }
               this.symbolOrderBookEE.emit('BINANCE_OB_UPDATES', orderBookData);
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
                this.dataFormat(JSON.stringify(pl));
            })
            ws.on('ping', (data) => {
                let ping = JSON.parse(data);
                try{
                    ws.send(JSON.stringify({'pong':ping}))
                }catch (err){
                    logger.error(`binance ping from server.err:${err.message}`);
                }
            })

            ws.on('pong', () => {
                logger.debug('Received pong from server')
            })

            ws.on('error', err => {
                logger.error(err)
            })

            ws.on('close', (closeEventCode, reason) => {
                if (!wsRef.closeInitiated) {
                    logger.error(`binance spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('binance spot publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('binance spot publicSocket no connection to close.')
        else {
            try{
                objRef.unMsg.method = "UNSUBSCRIBE";
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`binance spot publicSocket no connection to close.err: ${JSON.stringify(err)}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}