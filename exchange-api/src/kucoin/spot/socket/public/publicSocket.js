const {axios, Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(endpoint, socketUrl, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolOrderBookEE = new events();
        this.symbolKlineEE = new events;
    }

    async getToken(){
        let response = {
            success:false,
            data:null
        }
        try{
            let endpoint= `/api/v1/bullet-public`;
            logger.debug(`kucoin.socket.public.getToken.url: ${endpoint}`)
            await this.axiosInstance.post(endpoint).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data =  res.data.data;
                }else{
                    response.success = false;
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.socket.public.getToken:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.socket.public.getToken.err: ${err}`);
            })
            logger.info(`kucoin.socket.public.getToken.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.socket.public.getToken.error: ${error}`);
            return response;
        }
    }

    //input 时 interval格式换转换
    inputInterValFormat(interval){
        let inputV = '';
        if(interval.endsWith('m')){
            inputV=interval+'in'
        }else if(interval.endsWith('M')){
            inputV= interval.toLowerCase()+'on'
        }else if(interval.endsWith('d')){
            inputV= interval+'ay'
        }else if(interval.endsWith('w')){
            inputV= interval+'eek'
        }else if(interval.endsWith('y')){
            inputV= interval+'ear'
        }else if(interval.endsWith('h')){
            inputV= interval+'our'
        }else{
            inputV ='1day'
        }
        return inputV;
    }

    // 返回 interval 处理
    outInterValFormat(interval){
        let outV = parseInt(interval);
        if(interval.endsWith('min')){
            outV = `${outV}m`;
        }else if(interval.endsWith('mon')){
            outV = `${outV}M`;
        }else if(interval.endsWith('day')){
            outV = `${outV}d`;
        }else if(interval.endsWith('week')){
            outV = `${outV}w`;
        }else if(interval.endsWith('year')){
            outV= `${outV}y`;
        }else if(interval.endsWith('hour')){
            outV= `${outV}h`;
        }
        return outV;
    }


    async symbolKline ({fsym, tsym, interval}) {
        let symbol = `${fsym}-${tsym}`;
        let interv = this.inputInterValFormat(interval);
        let res = await this.getToken();
        if(res.success){
            let token = res.data.token;
            let endpoint = res.data.instanceServers[0].endpoint;
            let pinginterval = res.data.instanceServers[0].pingInterval;
            let url =`${endpoint}?token=${token}`;
            let msg = {
                "type":"subscribe",
                "topic":`/market/candles:${symbol}_${interv}`,
                "response":true
            }
            return this.subscribe(url, msg, pinginterval)
        }

    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}-${tsym}`
        let res = await this.getToken();
        if(res.success){
            let token = res.data.token;
            let endpoint = res.data.instanceServers[0].endpoint;
            let pinginterval = res.data.instanceServers[0].pingInterval;
            let url =`${endpoint}?token=${token}`;
            let msg = {
                "type":"subscribe",
                "topic": `/spotMarket/level2Depth5:${symbol}`,
                "response":true
            }
            return this.subscribe(url, msg, pinginterval)
        }
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.subject;
        switch (e_type){
            case "trade.candles.update":
                try {
                    var outInterVer = this.outInterValFormat(pl.topic.split('_')[1]);
                    var pairList = pl.data.symbol.split('-');
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
                        eventTime:Math.ceil(pl.data.time / 1000000),
                        ename: 'kucoin',
                        fsym: pairList[0],
                        tsym: tsym,
                        symbol:pl.data.symbol,
                        kline:{
                            startTime: parseInt(pl.data.candles[0]) * 1000,
                            endTime: '',
                            Interval: outInterVer,
                            openPrice: pl.data.candles[1],
                            closePrice:pl.data.candles[2],
                            highPrice:pl.data.candles[3],
                            lowPrice:pl.data.candles[4],
                            executedQty:pl.data.candles[5],
                            quoteVolume: pl.data.candles[6],
                        },
                        rawData: pl
                    }
                    this.symbolKlineEE.emit('KUCOIN_KL_UPDATE', klineData);
                }catch (err){
                    logger.error(`kucoin.spot.socket.publicSocket.kline.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
            case "level2":
                try {
                    var symbol = pl.topic.split(':')[1];
                    var pairList = symbol.split('-');
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
                        eventTime: pl.data.timestamp,
                        ename: 'kucoin',
                        fsym: pairList[0],
                        tsym: tsym,
                        symbol: symbol,
                        asks:pl.data.asks,
                        bids: pl.data.bids,

                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('KUCOIN_OB_UPDATES', orderBookData);
                    break;
                }catch (err){
                    logger.error(`kucoin.spot.socket.publicSocket.orderBook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
        }
    }
    subscribe (url, msg, pinginterval) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws;
            ws.on('open', ()=>{
                let msgPing = {id:Date.now(), type: 'ping'}
                wsRef.timer = setInterval( ()=>{
                    try{
                        ws.send(JSON.stringify(msgPing))
                    }catch (err){
                        console.log(`kucoin.spot.socket.public.socket.timer.err: ${err.message}`);
                    }
                }, pinginterval);
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.type === 'message') {
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
                    logger.error(`kucoin spot publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('kucoin spot publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('kucoin spot publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.type = "unsubscribe";
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`kucoin spot publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}