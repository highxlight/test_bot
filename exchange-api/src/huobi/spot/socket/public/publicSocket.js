const {Websocket, events, logger, zlib} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }
    outInterVar(interval){
        let interv = parseInt(interval);
        if(interval.endsWith('min')){
            interv= interv+'m';
        }else if(interval.endsWith('mon')){
            interv= interv+'M';
        }else if(interval.endsWith('day')){
            interv= interv+'d';
        }else if(interval.endsWith('week')){
            interv= interv+'w';
        }else if(interval.endsWith('year')){
            interv= interv+'y';
        }else if(interval.endsWith('hour')){
            interv= interv+'h';
        }
        return interv;
    }

    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}${tsym}`;
        if(interval.endsWith('m')){
            interval=interval+'in'
        }else if(interval.endsWith('M')){
            interval= interval.toLowerCase()+'on'
        }else if(interval.endsWith('d')){
            interval= interval+'ay'
        }else if(interval.endsWith('w')){
            interval= interval+'eek'
        }else if(interval.endsWith('y')){
            interval= interval+'ear'
        }else if(interval.endsWith('h')){
            interval= interval+'our'
        }else{
            interval ='1day'
        }
        let msg = {
            sub: `market.${symbol.toLowerCase()}.kline.${interval}`
        }
        return this.subscribe(this.wsURL, msg);
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`
        let msg = {
            sub: `market.${symbol.toLowerCase()}.depth.step0`
        };
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let datalist = pl.ch.split('.');
        switch (datalist[2]){
            case 'kline':
                try{
                    let interv = this.outInterVar(datalist[3]);
                    let klineData= {
                        eventType: 'kline',
                        eventTime: pl.ts,
                        ename: 'huobi',
                        fsym: null,
                        tsym: null,
                        symbol: datalist[1].toUpperCase(),
                        kline: {
                            startTime: parseInt(pl.tick.id) * 1000,
                            endTime: '',
                            Interval: this.interv,
                            openPrice: pl.tick.open,
                            closePrice: pl.tick.close,
                            highPrice: pl.tick.high,
                            lowPrice: pl.tick.low,
                            executedQty: pl.tick.amount,
                            quoteVolume: pl.tick.vol
                        },
                        rawData: pl
                    }
                    this.symbolKlineEE.emit('HUOBI_KL_UPDATE', klineData);
                }catch (err){
                    logger.error(`huobi.spot.socket.public.kline.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
            case 'depth':
                try{
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime: pl.ts,
                        ename: 'huobi',
                        fsym: null,
                        tsym: null,
                        symbol: datalist[1].toUpperCase(),
                        asks: pl.tick.asks,
                        bids: pl.tick.bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('HUOBI_OB_UPDATES', orderBookData);
                }catch (err){
                    logger.error(`huobi.spot.socket.public.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
                const result = Buffer.from(zlib.gunzipSync(data));
                const pl = JSON.parse(result.toString());
                if('ping' in pl){
                    let pingMsg = {"pong": pl.ping}
                    try {
                        ws.send(JSON.stringify(pingMsg));
                    }catch (err){
                        console.log(err.message);
                    }
                }else if('status' in pl){

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
                    logger.error(`huobi spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('huobi spot publicSocket reconnect to the server.')
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
    unsubscribe (wsRef) {
        if (!wsRef || !wsRef.ws) logger.warn('huobi spot publicSocket no connection to close.')
        else {
            try {
                wsRef.unMsg = {unsub: wsRef.unMsg.sub};
                wsRef.ws.send(JSON.stringify(wsRef.unMsg));
            }catch (err){
                logger.error(`huobi spot publicSocket no connection to close.err: ${err.message}`)
            }
            wsRef.closeInitiated = true
            wsRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}