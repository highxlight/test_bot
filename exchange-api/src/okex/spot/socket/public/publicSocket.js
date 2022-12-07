const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}/public`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}-${tsym}`;
        let msg = {
            "op": "subscribe",
            "args": [{
                "channel": `candle${interval.toUpperCase()}`,
                "instId":symbol
            }]
        }
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}-${tsym}`
        let msg = {
            "op": "subscribe",
            "args": [{
                "channel": "books5",
                "instId": symbol
            }]
        }
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.arg.channel;
        if(e_type.startsWith('candle')){
            e_type = 'candle';
        }
        switch (e_type){
            case 'candle':
                try{
                    var pairList = pl.arg.instId.split('-');
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
                    let klineData={
                        eventType: 'kline',
                        eventTime: pl.data[0][0],
                        ename: 'okex',
                        fsym: pairList[0],
                        tsym: tsym,
                        symbol: pl.arg.instId,
                        kline:{
                            startTime:pl.data[0][0],
                            endTime: '',
                            Interval: pl.arg.channel.split('candle')[1].toLowerCase(),
                            openPrice: pl.data[0][1],
                            closePrice: pl.data[0][4],
                            highPrice: pl.data[0][2],
                            lowPrice: pl.data[0][3],
                            executedQty:pl.data[0][5],
                            quoteVolume: pl.data[0][6],
                        },
                        rawData: pl
                    }
                    this.symbolKlineEE.emit('OKEX_KL_UPDATE', klineData);
                }catch (err) {
                    logger.error(`okex.spot.socket.public.kline.err:${err.message}, pl:${JSON.stringify(pl)}`);
                }
                break;
            case "books5":
                let result = pl.data[0];
                let asks = [], bids = [];
                result.asks.forEach(item=>{
                    let lisa = [item[0], item[3]];
                    asks.push(lisa);
                })
                result.bids.forEach(item=>{
                    let lisb = [item[0], item[3]];
                    bids.push(lisb);
                })
                var pairList = pl.arg.instId.split('-');
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
                    eventTime: result.ts,
                    ename: 'okex',
                    fsym: pairList[0],
                    tsym: tsym,
                    symbol: pl.arg.instId,
                    asks: asks,
                    bids: bids,
                    rawData: pl
                }
                this.symbolOrderBookEE.emit('OKEX_OB_UPDATES', orderBookData);
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
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    if(data !== 'pong') {
                        const pl = JSON.parse(data);
                        if(!('event' in pl)){
                            this.dataFormat(JSON.stringify(pl));
                        }else{
                            if(pl.event === 'unsubscribe'){
                               logger.info(`okex.public.socket.unsubscribe.success:${JSON.stringify(pl)}`);
                            }else if(pl.event === 'error'){
                                logger.error(`okex.public.socket.err: ${JSON.stringify(pl)}`)
                            }
                        }
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })

                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`okex spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('okex spot publicSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`okex.public.socket.error:${err.message}`)
            }
        }
        logger.debug(url)
        initConnect()
        return wsRef


    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) {
            logger.warn('okex spot publicSocket no connection to close.')
        }else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`okex spot publicSocket no connection to close.err: ${err.message}`)
            }

            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}