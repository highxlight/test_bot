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
        let symbol = `${fsym}-${tsym}`;
        let url = `${this.wsURL}-ws`;
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
            sub: `market.${symbol}.kline.${interval}`
        }
        return this.subscribe(url, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}-${tsym}`
        let url = `${this.wsURL}-ws`
        let msg = {
            sub: `market.${symbol}.depth.step0`
        };
        return this.subscribe(url, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let datalist = pl.ch.split('.');
        switch (datalist[2]){
            case 'kline':
                try{
                    var pairList = datalist[1].split('-');
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
                    let interv = this.outInterVar(datalist[3]);
                    let klineData= {
                        eventType: 'kline',
                        eventTime: pl.ts,
                        ename: 'huobi',
                        fsym: pairList[0],
                        tsym: tsym,
                        symbol: datalist[1],
                        kline: {
                            startTime: parseInt(pl.tick.id) * 1000,
                            endTime: '',
                            Interval: interv,
                            openPrice: pl.tick.open,
                            closePrice: pl.tick.close,
                            highPrice: pl.tick.high,
                            lowPrice: pl.tick.low,
                            executedQty: pl.tick.amount,
                            quoteVolume: pl.tick.vol
                        },
                        rawData: pl
                    }
                    this.symbolKlineEE.emit('HUOBI_FUTURE_KL_UPDATE', klineData);
                }catch (err){
                    logger.error(`huobi.future.socket.public.kline.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
            case 'depth':
                try{
                    var pairList = datalist[1].split('-');
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
                        eventTime: pl.ts,
                        ename: 'huobi',
                        fsym: pairList[0],
                        tsym: tsym,
                        symbol: datalist[1],
                        asks: pl.tick.asks,
                        bids: pl.tick.bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('HUOBI_FUTURE_OB_UPDATES', orderBookData);
                }catch (err){
                    logger.error(`huobi.future.socket.public.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
                    logger.error(`huobi future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('huobi future publicSocket reconnect to the server.')
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
        if (!wsRef || !wsRef.ws) logger.warn('huobi future publicSocket no connection to close.')
        else {
            try {
                wsRef.unMsg = {unsub: wsRef.unMsg.sub};
                wsRef.ws.send(JSON.stringify(wsRef.unMsg));
            }catch (err){
                logger.error(`huobi future publicSocket no connection to close.err: ${err.message}`)
            }
            wsRef.closeInitiated = true
            wsRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}