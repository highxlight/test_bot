const {axios, Websocket, events, logger} = require("../../../../utils/utils");

class PublicSocket{

    constructor(endpoint, socketUrl, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.symbolOrderBookEE = new events();
    }

    async getToken(){
        let response = {
            success:false,
            data:null
        }
        try{
            let endpoint= `/api/v1/bullet-public`;
            logger.debug(`poloniex.future.socket.public.getToken.url: ${endpoint}`)
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
                    msg: 'poloniex.future.socket.public.getToken:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`poloniex.future.socket.public.getToken.err: ${err}`);
            })
            logger.info(`poloniex.future.socket.public.getToken.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.future.socket.public.getToken.error: ${error}`);
            return response;
        }
    }

    async symbolOrderBook({fsym, tsym}){
        let symbol = `${fsym}${tsym}`;
        let res = await this.getToken();
        if(res.success){
            let token = res.data.token;
            let endpoint = res.data.instanceServers[0].endpoint;
            let pingInterval = res.data.instanceServers[0].pingInterval;
            let url =`${endpoint}?token=${token}`;
            let msg = {
                "type":"subscribe",
                "topic": `/contractMarket/level2Depth5:${symbol}`,
                "subject": "level2",
                "response":true
            }
            return this.subscribe(url, msg, pingInterval)
        }
    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.subject;
        switch (e_type){
            case "level2":
                try {
                    let symbol = pl.topic.split(':')[1];
                    let orderBookData = {
                        eventType: 'depthUpdate',
                        eventTime:pl.data.timestamp,
                        ename: 'poloniex',
                        fsym: null,
                        tsym: null,
                        symbol:symbol,
                        asks: pl.data.asks,
                        bids: pl.data.bids,
                        rawData: pl
                    }
                    this.symbolOrderBookEE.emit(`POLONIEX_FUTURE_OB_UPDATES`, orderBookData);
                }catch (err){
                    logger.error(`poloniex.future.socket.publicSocket.orderbook.err:${err.message}, pl: ${JSON.stringify(pl)}`);
                }
                break;
        }
    }

    subscribe (url, msg, pingInterval) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws
            ws.on('open', ()=>{
                let msgPing = {id:Date.now(), type: 'ping'}
                wsRef.timer = setInterval( ()=>{
                    try {
                        ws.send(JSON.stringify(msgPing))
                    }catch (err){
                        logger.error(`poloniex.future.public.ping.err: ${err.message}`)
                    }
                }, pingInterval)
                ws.send(JSON.stringify(msg));
                wsRef.unMsg = msg;
            })
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if(pl.type === 'message'){
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
                    logger.error(`poloniex future publicSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('poloniex future publicSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('poloniex future publicSocket no connection to close.')
        else {
            try {
                objRef.unMsg.type = "unsubscribe";
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`poloniex future publicSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }
}

module.exports = {PublicSocket}