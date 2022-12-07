const {Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(socketUrl) {
        this.wsURL = `${socketUrl}`;
        this.reconnectDelay = 5000;
        this.symbolKlineEE = new events();
        this.symbolOrderBookEE = new events();
    }

    // symbolKline ({fsym, tsym, interval}){
    //     let symbol = `${fsym}${tsym}`;
    //     let interv = parseInt(interval);
    //     if(interval.endsWith('m')){
    //         interv = interv * 60
    //     }else if(interval.endsWith('h')){
    //         interv = interv * 60 * 60
    //     }else if(interval.endsWith('d')){
    //         interv = interv * 24 * 60 * 60
    //     }else if(interval.endsWith('w')){
    //         interv = interv * 7 * 24 * 60 * 60
    //     }else{
    //         interv = 60
    //     }
    //     let msg = {
    //         method: "kline.subscribe",
    //         params: [symbol, interv],
    //         id: Date.now()
    //     }
    //     this.subscribe(this.wsURL, msg)
    // }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`
        let msg = {
            method: "depth.subscribe",
            params: [symbol, 50, "0.01", true],
            id: Date.now()
        }
       return this.subscribe(this.wsURL, msg)
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.method;
        switch (e_type){
            case "depth.update":
                try{
                    let result = pl.params;
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime: null,
                        ename: 'coinex',
                        fsym: null,
                        tsym: null,
                        symbol: result[2],
                        asks: result[1].asks,
                        bids: result[1].bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit('COINEX_FUTURE_OB_UPDATES', orderBookData);
                }catch (err) {
                    logger.error(`coinex.future.socket.public.orderbook.err:${err.message}, pl:${JSON.stringify(pl)}`);
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
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                })
                ws.on('message', (data)=>{
                    const pl = JSON.parse(data);
                    if(pl.method === 'depth.update' || pl.method === 'kline.update'){
                        this.dataFormat(JSON.stringify(pl));
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })

                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`coinex future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('coinex future publicSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`coinex.future.public.socket.error:${err.message}`)
            }
        }
        logger.debug(url)
        initConnect()
        return wsRef


    }
    unsubscribe (objRef) {
        if (!objRef || !objRef.ws) {
            logger.warn('coinex future publicSocket no connection to close.')
        }else {
            try {
                if(objRef.unMsg.method = 'depth.subscribe'){
                    objRef.unMsg.method = 'depth.unsubscribe';
                }else if(objRef.unMsg.method = 'kline.subscribe'){
                    objRef.unMsg.method = 'kline.unsubscribe'
                }
                objRef.unMsg.method = 'depth.unsubscribe';
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`coinex future publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}