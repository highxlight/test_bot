const {axios, createSignature, dataCalculation,  ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name = '';
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey,secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
    }



    /**
     *
     * @returns either an HTTP Response holds the result of the request or the error
     *
     * This get the account balance of the user
     *
     * Reference: https://binance-docs.github.io/apidocs/spot/en/#account-information-user_data
     */
    async getAccountBalance() {
        const timestamp = Date.now();
        const method = 'GET'
        var queryString = `timestamp=${timestamp.toString()}`;
        const signature = createSignature(ExchangeInfo.Binance.name,
            this.#secretKey,
            queryString, method);

        queryString += `&signature=${signature}`;
        logger.debug(`binance.spot.account.getAccountBalance.req: ${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try {
            let endpoint =`/api/v3/account?${queryString}`;
            logger.debug(`binance.spot.account.getAccountBalance.url:${endpoint}`);
            await this.axiosInstance.get(endpoint, {
                headers: {'X-MBX-APIKEY': this.#apiKey}
            }).then(res => {
                let balances = []
                res.data.balances.forEach(item=>{
                    let dicData = {
                        asset: item.asset,
                        available: item.free,
                        locked: item.locked,
                        balance: dataCalculation(item.free, item.locked, '+')
                    }
                    balances.push(dicData);
                })
                response.success = true;
                response.data={
                    ename: this.#name,
                    exchange:"binance",
                    rawData: res.data,
                    balances: balances
                }
            }).catch(err => {
                let dicData = {
                    code:400,
                    msg: 'binance.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`binance.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`binance.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`binance.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Account}