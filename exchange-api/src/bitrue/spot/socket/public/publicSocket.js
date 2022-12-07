const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    // symbolKline ({fsym, tsym, interval}) {
    //     let symbol = `${fsym}_${tsym}`;
    //     if(interval.endsWith('h')){
    //         interval = interval.toUpperCase();
    //     }
    //     let msg = {
    //         "op": "subscribe",
    //         "args": [`spot/kline${interval}:${symbol}`]
    //     }
    //     return this.subscribe(this.wsURL, msg)
    // }
    //
    // symbolOrderBook({fsym, tsym}){
    //     let symbol = `${fsym}_${tsym}`
    //     let msg = {
    //         "op": "subscribe",
    //         "args": [`spot/depth5:${symbol}`]
    //     }
    //     return this.subscribe(this.wsURL, msg)
    // }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.table;
        if(e_type.startsWith('spot/kline')){
            e_type = 'kline';
        }else if(e_type.startsWith('spot/depth')){
            e_type = 'orderBook';
        }
        switch (e_type){
            case 'kline':
                try{
                    let result = pl.data;
                    result.forEach(item=>{
                        var pairList = item.symbol.split('_');
                        let klineData={
                            eventType: 'kline',
                            eventTime: item.candle[0],
                            ename: 'bitrue',
                            fsym: pairList[0],
                            tsym: pairList[1],
                            symbol: item.symbol,
                            kline:{
                                startTime:item.candle[0],
                                endTime: '',
                                Interval:  pl.table.split('spot/kline')[1].toLowerCase(),
                                openPrice: item.candle[1],
                                closePrice: item.candle[4],
                                highPrice: item.candle[2],
                                lowPrice: item.candle[3],
                                executedQty:item.candle[5],
                                quoteVolume: '',
                            },
                            rawData: pl
                        }
                        this.symbolKlineEE.emit('BITRUE_KL_UPDATE', klineData);

                    })
                }catch (err) {
                    logger.error(`bitrue.spot.socket.public.kline.err:${err.message}, pl:${JSON.stringify(pl)}`);
                }
                break;
            case "orderBook":
                try{
                    let result = pl.data;
                    result.forEach(item=>{
                        var pairList = item.symbol.split('_');
                        let orderBookData = {
                            eventType: 'depthUpdate',
                            eventTime: item.ms_t,
                            ename: 'bitrue',
                            fsym: pairList[0],
                            tsym: pairList[1],
                            symbol: item.symbol,
                            asks: item.asks,
                            bids: item.bids,
                            rawData: item
                        }
                        this.symbolOrderBookEE.emit('BITRUE_OB_UPDATES', orderBookData);
                    })

                }catch (err) {
                    logger.error(`bitrue.spot.socket.public.orderbook.err:${err.message}, pl:${JSON.stringify(pl)}`);
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
                            logger.error(`bitrue.spot.public.ping.err: ${err.message}`)
                        }
                    }, 18000)
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    if(data !== 'pong') {
                        const pl = JSON.parse(data);
                        if('table' in pl){
                            this.dataFormat(JSON.stringify(pl));
                        }
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })

                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`bitrue spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('bitrue spot publicSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`bitrue.public.socket.error:${err.message}`)
            }
        }
        logger.debug(url)
        initConnect()
        return wsRef


    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) {
            logger.warn('bitrue spot publicSocket no connection to close.')
        }else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`bitrue spot publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}