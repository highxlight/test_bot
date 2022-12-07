const {axios, Websocket,ExchangeInfo, createSignature, events, logger} = require("../../../../utils/utils");

class PrivateSocekt{

    #apiKey = '';
    #secretKey = '';
    #passphrase = '';
    #name = '';
    #header = {
        'KC-API-SIGN': '',
        'KC-API-TIMESTAMP': '',
        'KC-API-KEY': '',
        'KC-API-PASSPHRASE': '',
        'KC-API-VERSION': '2'
    }

    constructor(name, apiKey,secretKey, passphrase, endpoint, socketUrl, timeout) {
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.#header['KC-API-KEY'] = this.#apiKey;
        this.#header['KC-API-PASSPHRASE'] = this.#passphrase;
        this.orderStateUpdateEE = new events();
    }

    async getToken(){
        const timestamp=Date.now().toString();
        let endpoint= `/api/v1/bullet-private`;
        const signature=createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            'POST',
            endpoint,
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{

            logger.debug(`kucoin.socket.private.getToken.url: ${endpoint}`)
            await this.axiosInstance.post(endpoint, '', {
                headers: this.#header
            }).then(res=>{
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
                    msg: 'kucoin.future.socket.private.getToken:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.socket.private.getToken.err: ${err}`);
            })
            logger.info(`kucoin.future.socket.public.getToken.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.socket.private.getToken.error: ${error}`);
            return response;
        }
    }

    async orderStateUpdate(){
        let res = await this.getToken();
        if(res.success){
            let token = res.data.token;
            let endpoint = res.data.instanceServers[0].endpoint;
            let pingInterval = res.data.instanceServers[0].pingInterval;
            let url =`${endpoint}?token=${token}`;
            let msg = {
                "type":"subscribe",
                "topic": `/contractMarket/tradeOrders`,
                "response":true
            }
           return this.subscribe(url, msg, pingInterval)
        }

    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        let e_type = pl.e;
        switch (e_type){
            case 'orderChange':
                let status = 'NEW';
                if(pl.data.status === 'done' && pl.data.filledSize === pl.data.size ){
                    status = 'FILLED';
                }else if(pl.data.status === 'done' && parseFloat(pl.data.filledSize) === 0){
                    status = 'CANCELED';
                }else if(pl.data.status === 'done' && parseFloat(pl.data.filledSize) > 0){
                    status = 'EXPIRED';
                }else{
                    status = 'NEW';
                }
                let upData = {
                    eventType: 'executionReport',
                    eventTime:Math.ceil(pl.data.ts / 1000000),
                    ename: this.#name,
                    exchange: 'kucoin',
                    clientOrderId: pl.data.clientOid,
                    orderId: pl.data.orderId,
                    side: pl.data.side,
                    type:pl.data.orderType,
                    status:status,
                    executedQty:pl.data.filledSize,
                    updateTime:Math.ceil(pl.data.ts / 1000000),
                    rawData: pl
                }
                this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_FUTURE_OR_UPDATE`, upData);
        }
    }

    subscribe (url, msg, pingInterval) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws;
            ws.on('open', ()=>{
                let msgPing = {id:Date.now(), type: 'ping'}
                wsRef.timer = setInterval(()=>{
                    ws.send(JSON.stringify(msgPing));
                }, pingInterval);
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
                    logger.error(`kucoin future privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('kucoin future privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('kucoin future privateSocket no connection to close.')
        else {
            try {
                objRef.unMsg.type = "unsubscribe";
                clearInterval(objRef.timer);
                objRef.ws.send(JSON.stringify(objRef.unMsg));
            }catch (err){
                logger.error(`kucoin future privateSocket no connection to close.err: ${err.message}`)
            }
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}