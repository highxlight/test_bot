const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}/ws`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
        this.markPriceUpdateEE = new events();
    }

    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}${tsym}`;
        var msg = {
            method: "SUBSCRIBE",
            params:[`${symbol.toLowerCase()}@kline_${interval}`],
            id: Date.now()
        }
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`;
        var msg = {
            method: "SUBSCRIBE",
            params:[`${symbol.toLowerCase()}@depth@500ms`],
            id: Date.now()
        }
        return this.subscribe(this.wsURL, msg)
    }

    async markPriceUpdate({fsym, tsym}){
        let symbol = `${fsym}${tsym}`;
        var msg = {
            method: "SUBSCRIBE",
            params:[`${symbol.toLowerCase()}@markPrice@1s`],
            id: Date.now()
        }
        return this.subscribe(this.wsURL, msg)
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
                this.symbolKlineEE.emit('BINANCE_FUTURE_KL_UPDATE', klineData);
                break;
            case "depthUpdate":
                let orderBookData = {
                    eventType: 'depthUpdate',
                    eventTime:pl.E,
                    ename: 'binance',
                    symbol: pl.s,
                    asks: pl.a,
                    bids: pl.b,
                    rawData: pl
                }
                this.symbolOrderBookEE.emit('BINANCE_FUTURE_OB_UPDATES', orderBookData);
                break;
            case 'markPriceUpdate':
                let marketPriceData = {
                    eventType: 'markPriceUpdate',
                    eventTime:pl.E,
                    ename: 'binance',
                    symbol: pl.s,
                    price: pl.p,
                    inPrice: pl.i,
                    rate: pl.r,
                    nextTime: pl.T,
                    rawData: pl
                }
                this.markPriceUpdateEE.emit('BINANCE_FUTURE_MP_UPDATE', marketPriceData);
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
                if('ping' in pl) {
                    try {
                        ws.pong();
                    }catch (err){
                        logger.error(`binance.future.public.ping.err: ${err.message}`)
                    }
                }else{
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
                    logger.error(`binance future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('binance future publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('binance future publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.method = 'UNSUBSCRIBE';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`binance future publicSocket no connection to close.err:${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}