const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Account{

    #apiKey='';
    #secretKey='';
    #name="";
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint,timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
    }

    /**
     * getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance() {
        const timestamp = Date.now();
        const method = 'GET'
        var queryString = `timestamp=${timestamp.toString()}`;
        const signature = createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);

        queryString += `&signature=${signature}`;
        logger.debug(`binance.future.account.getAccountBalance.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint =`/fapi/v2/account?${queryString}`;
            logger.debug(`binance.future.account.getAccountBalance.url:${endpoint}`);
            await this.axiosInstance.get(endpoint, {
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res => {
                response.success =true;
                response.data = {
                    ename: this.#name,
                    exchange:"binance",
                    balances: [],
                    rawData: res.data
                }
                res.data.assets.forEach(item=>{
                    let dicData = {
                        asset: item.asset,
                        available: item.availableBalance,
                        balance: item.walletBalance
                    }
                    response.data.balances.push(dicData);
                })
            }).catch(err => {
                let dicData = {
                    code:400,
                    msg: 'binance.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`binance.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`binance.future.account.getAccountBalance.error: ${error}`);
            return response
        }
    }

    /**
     * getSymbolPositions
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getSymbolPositions(fsym, tsym) {
        const timestamp = Date.now();
        const method = 'GET'
        var queryString = `timestamp=${timestamp.toString()}`;
        const signature = createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);

        queryString += `&signature=${signature}`;
        logger.debug(`binance.future.account.getSymbolPositions.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let symbol = `${fsym}${tsym}`;
            let endpoint =`/fapi/v2/account?${queryString}`;
            logger.debug(`binance.future.account.getSymbolPositions.url:${endpoint}`);
            await this.axiosInstance.get(endpoint, {
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res => {
                response.success =true;
                let data = {};
                res.data.positions.forEach(item=>{
                    if(item.symbol === symbol.toUpperCase()){
                        data = {
                            ename: this.#name,
                            symbol: item.symbol,
                            initialMargin: item.initialMargin,
                            maintMargin: item.maintMargin,
                            unrealizedProfit:item.unrealizedProfit,
                            positionInitialMargin: item.positionInitialMargin,
                            openOrderInitialMargin:item.openOrderInitialMargin,
                            leverage: item.leverage,
                            isolated: item.isolated,
                            entryPrice:item.entryPrice,
                            maxNotional: item.maxNotional,
                            positionSide: item.positionSide,
                            positionAmt: item.positionAmt,
                            rawData:item
                        }
                        return;
                    }
                })
                response.data = data;
            }).catch(err => {
                let dicData = {
                    code:400,
                    msg: 'binance.future.account.getSymbolPositions:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.future.account.getSymbolPositions.err: ${err}`);
            })
            logger.info(`binance.future.account.getSymbolPositions.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`binance.future.account.getSymbolPositions.error: ${error}`);
            return response
        }
    }
}

module.exports = {Account}
