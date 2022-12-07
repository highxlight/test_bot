const {axios, createSignature, dataCalculation, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        'X-ACCESS-KEY': '', //APIKey
        'X-ACCESS-SIGN': '', // signature
        'X-ACCESS-NONCE': '', // timestamp
    }
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(name, apiKey,secretKey, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#header['X-ACCESS-KEY']=this.#apiKey;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp= Date.now();
        const endpoint='/v2/account/balances?purseType=SPTP';
        const signature=createSignature(ExchangeInfo.Aax.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp,
            '');
        this.#header['X-ACCESS-SIGN']=signature;
        this.#header['X-ACCESS-NONCE']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`aax.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1){
                    let balances = [];
                    res.data.data.forEach(item=>{
                        let dicData = {
                            asset: item.currency,
                            available: item.available,
                            locked: item.unavailable,
                            balance: dataCalculation(item.unavailable, item.available, '+')
                        }
                        balances.push(dicData);
                    })
                    response.success = true;
                    response.data ={
                        ename:this.#name,
                        exchange: 'aax',
                        balances: balances,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.message,
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'aax.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`aax.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`aax.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`aax.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}