const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }
    async splicingSymbol(fsym, tsym){
        let now = new Date();
        let noMonth = now.getMonth() + 1;
        let year = now.getFullYear().toString();
        let year_n = year.substr(year.length-2);
        let currQuarter = Math.floor( ( noMonth % 3 == 0 ? ( noMonth / 3 ) : ( noMonth / 3 + 1 ) ) );
        let list=['H', 'M', 'U', 'Z'];
        return `${fsym}${tsym}${list[currQuarter-1]}${year_n}`;
    }
    async symbolKline({fsym, tsym, interval}){
        let symbol = await this.splicingSymbol(fsym, tsym);
        let interv = '';
        if(interval.endsWith('m')){
            interv = parseInt(interval);
        }else if(interval.endsWith('M')){
            interv = 'M';
        }else if(interval.endsWith('d')){
            interv = 'D';
        }else if(interval.endsWith('w')){
            interv = 'W';
        }else{
            interv = 'D';
        }
        let msg = {"op":"subscribe","args":[`klineV2.${interv}.${symbol}`]}
        return this.subscribe(this.wsURL, msg)
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = await this.splicingSymbol(fsym, tsym);;
        let msg = {op: "subscribe", args:[`orderBook_200.100ms.${symbol}`]}
        return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload);
        let e_type = '';
        if(pl.topic.indexOf('kline') !== -1 ){
            e_type = 'kline';
        }else if(pl.topic.indexOf('orderBook') !== -1 ){
            e_type = 'snapshot';
        }
        switch (e_type){
            case "kline":
                try{
                    let dataList  = pl.topic.split('.');
                    let interv =  '1m';
                    if(dataList[1] === 'D'){
                        interv = '1day';
                    }else if(dataList[1] === 'W'){
                        interv = '7day';
                    }else if(dataList[1] === 'M'){
                        interv = '30day';
                    }else{
                        interv = parseInt(dataList[1]) + 'm';
                    }
                    pl.data.forEach(item=>{
                        let klineData={
                            eventType: 'kline',
                            eventTime: pl.sendTime,
                            ename: 'bybit',
                            fsym: null,
                            tsym: null,
                            symbol: dataList[2],
                            kline:{
                                startTime: parseInt(item.start) * 1000,
                                endTime: item.end,
                                Interval: interv,
                                openPrice: item.open,
                                closePrice: item.close,
                                highPrice: item.high,
                                lowPrice: item.low ,
                                executedQty: item.volume,
                                quoteVolume: item.turnover
                            },
                            rawData: pl
                        }
                        this.symbolKlineEE.emit('BYBIT_FUTURE_KL_UPDATE', klineData);
                    })
                }catch (err) {
                    logger.error(`bybit.future.socket.public.kline.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
            case "snapshot":
                try{
                    let asks = [], bids=[];
                    if(pl.data.length > 0){
                        pl.data.forEach(item=>{
                            if(item.side.toLowerCase() === 'buy'){
                                asks.push([item.price, item.size]);
                            }else if(item.side.toLowerCase() === 'sell'){
                                bids.push([item.price, item.size]);
                            }
                        })
                    }
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime: pl.timestamp_e6,
                        ename: 'bybit',
                        fsym: null,
                        tsym: null,
                        symbol: pl.topic.split('.')[2],
                        asks:asks,
                        bids: bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('BYBIT_FUTURE_OB_UPDATES', orderBookData);
                }catch (err) {
                    logger.error(`bybit.future.socket.public.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
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
                wsRef.timer = setInterval(()=>{
                    try {
                        ws.send(JSON.stringify({'op': 'ping'}))
                    }catch (err){
                        logger.error(`bybit.future.public.ping.err: ${err.message}`)
                    }
                }, 30000)
                ws.send(JSON.stringify({'op': 'ping'}))
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.success){
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                }else{
                    if('topic' in pl){
                        this.dataFormat(JSON.stringify(pl));
                    }
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
                    logger.error(`bybit future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('bybit future publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('bybit future publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.op = 'unsubscribe';
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`bybit future publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}