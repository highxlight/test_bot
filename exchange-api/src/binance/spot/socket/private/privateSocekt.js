const {axios, Websocket, events, logger} = require("../../../../utils/utils");

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name = '';

    constructor(name, apiKey,secretKey, endpoint, socketUrl, timeout) {
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.wsURL = socketUrl;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    async getListenKey(){
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint =`/api/v3/userDataStream`;
            logger.debug(`binance.spot.socket.private.getListenKey.url:${endpoint}`);
            await this.axiosInstance.post(endpoint,'',{
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res => {
                response.success = true;
                response.data = res.data
            }).catch(err => {
                let dicData = {
                    code:400,
                    msg: 'binance.spot.socket.private.getListenKey:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.socket.private.getListenKey.err: ${err}`);
            })
            logger.info(`binance.spot.socket.private.getListenKey.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`binance.spot.socket.private.getListenKey.error: ${error}`);
            return response;
        }
    }

    async orderStateUpdate(){
        let listenKeyObj = await this.getListenKey();
        if(listenKeyObj.success){
            let listenKey = listenKeyObj.data.listenKey;
            let url = `${this.wsURL}/stream?streams=${listenKey}`;
            return this.subscribe(url)
        }

    }

    dataFormat(payload){
        let pl = JSON.parse(payload) ;
        if('data' in pl){
            pl = pl.data;
        }
        let e_type = pl.e;
        switch (e_type){
            case 'executionReport':
                let upData={
                    eventType: 'executionReport',
                    eventTime:pl.E,
                    ename: this.#name,
                    clientOrderId: pl.c,
                    orderId: pl.i,
                    side:pl.S.toLowerCase(),
                    type:pl.o.toLowerCase(),
                    status:pl.X,
                    executedQty:pl.z,
                    quoteQty:pl.Z,
                    updateTime: pl.T,
                    rawData: pl
                }
                this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
                break;
        }
    }


    subscribe (url) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            const ws = new Websocket(url)
            wsRef.ws = ws
            ws.on('message', (data)=>{
                const pl = JSON.parse(data);
                if('ping' in pl) {
                    ws.pong()
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
                    logger.error(`binance spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                    setTimeout(() => {
                        logger.debug('binance spot privateSocket reconnect to the server.')
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
        if (!objRef || !objRef.ws) logger.warn('binance spot privateSocket no connection to close.')
        else {
            objRef.closeInitiated = true
            objRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}