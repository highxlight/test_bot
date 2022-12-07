const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Account {

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

    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, passphrase, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.#header['KC-API-KEY'] = this.#apiKey;
        this.#header['KC-API-PASSPHRASE'] = this.#passphrase;
    }

    async getAccountBalance(){
        const timestamp=Date.now().toString();
        let endpoint = '/api/v1/account-overview?currency=USDT';
        const signature=createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            'GET',
            endpoint,
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`kucoin.future.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code === '200000'){
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        exchange:'kucoin',
                        balances: [{
                            asset: res.data.data.currency,
                            available: res.data.data.availableBalance,
                            balance: res.data.data.marginBalance
                        } ],
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`kucoin.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }

    /**
     * getSymbolPositions
     * @param fsym
     * @param tsym
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getSymbolPositions(fsym, tsym){
        const timestamp=Date.now().toString();
        let symbol = `${fsym}${tsym}`
        let market = tsym === 'USDT' ? `${symbol}M` : symbol;
        let endpoint = `/api/v1/position?symbol=${market.toUpperCase()}`;
        const signature=createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            'GET',
            endpoint,
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`kucoin.future.account.getSymbolPositions.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code === '200000' && res.data.data){
                    response.success = true;
                    let item = res.data.data;
                    response.data = {
                        ename: this.#name,
                        symbol: item.symbol,
                        initialMargin: null,
                        maintMargin: item.posMaint,
                        unrealizedProfit: null,
                        positionInitialMargin: item.posMaint,
                        openOrderInitialMargin: null,
                        leverage: item.realLeverage,
                        isolated: item.crossMode,
                        entryPrice:item.currentCost,
                        maxNotional: null,
                        positionSide: null,
                        positionAmt: item.currentQty,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = res.data;
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.future.account.getSymbolPositions:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.future.account.getSymbolPositions.err: ${err}`);
            })
            logger.info(`kucoin.future.account.getSymbolPositions.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.future.account.getSymbolPositions.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}