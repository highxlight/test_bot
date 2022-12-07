const {Websocket, axios, events, logger} = require("../../../../utils/utils");

class PrivateSocekt{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'X-MBX-APIKEY': '', //APIKey
        'Content-type': 'application/x-www-form-urlencoded', // signature
    }

    constructor(name, apiKey,secretKey, endpoint, socketUrl, timeout) {
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#header['X-MBX-APIKEY']=this.#apiKey;
        this.wsURL = `${socketUrl}`;
        this.reconnectDelay = 5000;
        this.orderStateUpdateEE = new  events();
    }

    async getListenKey(){
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint =`/poseidon/api/v1/listenKey`;
            logger.debug(`bitrue.spot.socket.private.getListenKey.url:${endpoint}`);
            await this.axiosInstance.post(endpoint,'',{
                headers: this.#header
            }).then(res => {
                response.success = true;
                response.data = res.data
            }).catch(err => {
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.socket.private.getListenKey:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`bitrue.spot.socket.private.getListenKey.err: ${err}`);
            })
            logger.info(`bitrue.spot.socket.private.getListenKey.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.socket.private.getListenKey.error: ${error}`);
            return response;
        }
    }

    async orderStateUpdate(){
        let result = await this.getListenKey();
        if(result.success){
            let url = `${this.wsURL}/stream?listenKey=${result.data.data.listenKey}`
            let msg = {"event":"sub","params":{"channel":"user_order_update"}}
            return this.subscribe(url, msg);
        }
    }

    dataFormat(payload){
        let pl = JSON.parse(payload);
        let upData={
            eventType: 'executionReport',
            eventTime: pl.E,
            ename: this.#name,
            exchange: 'bitrue',
            clientOrderId: pl.c,
            orderId: pl.i,
            side: pl.S.toLowerCase(),
            type: pl.o.toLowerCase(),
            status: pl.X,
            executedQty:pl.z,
            quoteQty: pl.Y,
            updateTime: pl.T,
            rawData: payload
        }
        this.orderStateUpdateEE.emit(`${this.#name.toUpperCase()}_OR_UPDATE`, upData);
    }


    subscribe (url, msg) {
        const wsRef = {}
        wsRef.closeInitiated = false
        const initConnect = () => {
            try{
                const ws = new Websocket(url);
                ws.on('open', ()=>{
                    ws.send(JSON.stringify(msg));
                    wsRef.unMsg = msg;
                    setInterval(()=>{
                       ws.send(JSON.stringify({"event":"pong","ts": Date.now()}));
                    }, 10*60*60)
                })
                ws.on('message', (data)=>{
                    const pl = JSON.parse(data);
                    if(pl.e === 'executionReport'){
                        this.dataFormat(pl);
                    }
                })
                ws.on('error', err => {
                    logger.error(err)
                })
                ws.on('close', (closeEventCode, reason) => {
                    if (!wsRef.closeInitiated) {
                        logger.error(`bitrue spot privateSocket connection close due to ${closeEventCode}: ${reason}.`)
                        setTimeout(() => {
                            logger.debug('bitrue spot privateSocket reconnect to the server.')
                            initConnect()
                        }, this.reconnectDelay)
                    } else {
                        wsRef.closeInitiated = false
                    }
                })
            }catch (err){
                logger.error(`biture.private.socket.error:${err.message}`)
            }

        }
        logger.debug(url);
        initConnect();
        return wsRef
    }

    unsubscribe (objwsRef) {
        if (!objwsRef || !objwsRef.ws) {
            logger.warn('bitrue spot privateSocket no connection to close.')
        }else {
            try {
                objwsRef.unMsg.event = "unsub";
                objwsRef.ws.send(JSON.stringify(objwsRef.unMsg));
            }catch (err){
                logger.error(`bitrue spot privateSocket no connection to close.err:${err.message}`)
            }
            objwsRef.closeInitiated = true
            objwsRef.ws.close()
        }
    }

}


module.exports = {PrivateSocekt}