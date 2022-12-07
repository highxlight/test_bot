const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}/marketdata/v2/`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}${tsym}`;
        let msg = {
            "e": "subscribe",
            "stream": `${symbol}@${interval}_candles`
        }
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`
        let msg = {"e":"subscribe","stream":`${symbol}@book_50`}
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let etype = pl.e.split('@');
        let e_type  = 'candles';
        if(etype[1].endsWith('book_50')){
            e_type = 'book';
        }
        switch (e_type){
            case 'candles':
                try{
                    var pairList = pl.e.split('@');
                    let klineData={
                        eventType: 'kline',
                        eventTime: parseInt(pl.t) * 1000,
                        ename: 'aax',
                        fsym: null,
                        tsym: null,
                        symbol: pairList[0],
                        kline:{
                            startTime:parseInt(pl.s) * 1000,
                            endTime: '',
                            Interval: pairList[1].split('_')[0].toLowerCase(),
                            openPrice: pl.o,
                            closePrice: pl.c,
                            highPrice: pl.h,
                            lowPrice: pl.l,
                            executedQty:pl.v,
                            quoteVolume: '',
                        },
                        rawData: pl
                    }
                    this.symbolKlineEE.emit('AAX_KL_UPDATE', klineData);
                }catch (err) {
                    logger.error(`aax.spot.socket.public.kline.err:${err.message}, pl:${JSON.stringify(pl)}`);
                }
                break;
            case "book":
                try{
                    var pairList = pl.e.split('@');
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime: pl.t,
                        ename: 'aax',
                        fsym: null,
                        tsym: null,
                        symbol: pairList[0],
                        asks: pl.asks,
                        bids: pl.bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('AAX_OB_UPDATES', orderBookData);
                }catch (err) {
                    logger.error(`aax.spot.socket.public.orderbook.err:${err.message}, pl:${JSON.stringify(pl)}`);
                }
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
                    wsRef.timer = setInterval(()=>{
                        try {
                            ws.send('ping');
                        }catch (err){
                            logger.error(`aax.spot.public.ping.err: ${err.message}`)
                        }
                    }, 20000)
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    if(data !== 'pong') {
                        const pl = JSON.parse(data);
                        if(pl.e.endsWith('candles') || pl.e.endsWith('book_50')){
                            this.dataFormat(JSON.stringify(pl));
                        }
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })

                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`aax spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('aax spot publicSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`aax.public.socket.error:${err.message}`)
            }
        }
        logger.debug(url)
        initConnect()
        return wsRef


    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) {
            logger.warn('aax spot publicSocket no connection to close.')
        }else {
            try{
                objRef.unMsg.op = 'unsubscribe';
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
                objRef.closeInitiated = true
                objRef.ws.close()
            }catch (err){
                logger.error(`aax spot publicSocket no connection to close.err:${err.message}`);
            }
        }
    }
}

module.exports = {PublicSocket}