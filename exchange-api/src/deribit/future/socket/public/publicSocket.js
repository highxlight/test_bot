const {Websocket, events, logger} = require("../../../../utils/utils");


class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    async symbolKline({fsym, tsym, interval}){
        let symbol = `${fsym}-${tsym}`;
        if(interval.endsWith('m')){
            interval= parseInt(interval);
        }else if(interval.endsWith('M')){
            interval= '30D'
        }else if(interval.endsWith('d')){
            interval= interval.toUpperCase()
        }else if(interval.endsWith('w')){
            interval= parseInt(interval)+'D'
        }else if(interval.endsWith('y')){
            interval= '365D'
        }else if(interval.endsWith('h')){
            interval= parseFloat(interval) * 60;
        }else{
            interval ='1D'
        }
        let msg = {"jsonrpc": "2.0",
            "id": 'kline',
            "method": "public/subscribe",
            "params" : {
                "channels": [`chart.trades.${symbol}.${interval}`]
            }
        };
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}-${tsym}`;
        let msg = {"jsonrpc": "2.0",
            "id": 'orderBook',
            "method": "public/subscribe",
            "params" : {
                "channels": [`book.${symbol}.100ms`]
            }
        };
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload);
        let channel = pl.params.channel;
        let dataList = channel.split('.');
        let result  = pl.params.data;
        switch (dataList[0]){
            case 'chart':
                var pairList = dataList[2].split('-');
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
                let intev = '1m';
                if(dataList[3].endsWith('D')){
                    intev = dataList[3].toLowerCase();
                }else{
                    intev = dataList[3]+'m';
                }
                let klineData = {
                    eventType: 'kline',
                    eventTime:result.tick,
                    ename: 'deribit',
                    fsym: pairList[0],
                    tsym: tsym,
                    symbol:dataList[2],
                    kline:{
                        startTime: null,
                        endTime: result.tick,
                        Interval: intev,
                        openPrice: result.open,
                        closePrice: result.close,
                        highPrice: result.high,
                        lowPrice: result.low,
                        executedQty: result.volume,
                        quoteVolume: result.cost
                    },
                    rawData: pl

                }
                this.symbolKlineEE.emit('DERIBIT_FUTURE_KL_UPDATES', klineData);
                break;
            case 'book':
                let asks = [], bids=[];
                result.asks.forEach(item=>{
                    let lisa = [item[1], item[2]];
                    asks.push(lisa);
                })
                result.bids.forEach(item=>{
                    let lisb = [item[1], item[2]];
                    bids.push(lisb);
                })
                var pairList = dataList[1].split('-');
                let orderBookData = {
                    eventType: 'depthUpdate',
                    eventTime: result.timestamp,
                    ename: 'deribit',
                    fsym: pairList[0],
                    tsym: pairList[1],
                    symbol:dataList[1],
                    asks: asks,
                    bids: bids,
                    rawData: pl
                }
                this.symbolOrderBookEE.emit('DERIBIT_FUTURE_OB_UPDATES', orderBookData);
                break;
        }
    }


    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            try{
                const ws = new Websocket(url)
                wsRef.ws = ws;
                ws.on('open', ()=>{
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    const pl = JSON.parse(data);
                    if('error' in pl){
                        logger.info(`deribit.futrue.public.socket.error:${JSON.stringify(pl)}`)
                    }else if('params' in pl){
                        this.dataFormat(JSON.stringify(pl));
                    }else{
                        logger.info(`deribit.futrue.public.socket.info:${JSON.stringify(pl)}`)
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })

                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`deribit future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('deribit future publicSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`deribit.future.public.socket.error:${err.message}`);
            }

        }
        logger.debug(url)
        initConnect()
        return wsRef
    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) logger.warn('deribit future publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.method = "public/unsubscribe";
                objRef.ws.send(JSON.stringify(objRef.unMsg))
            }catch (err){
                logger.error(`deribit future publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}