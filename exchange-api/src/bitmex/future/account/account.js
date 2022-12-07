const {axios, createSignature, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        'api-expires': '',
        'api-key': '',
        'api-signature': ''
    };
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
        this.#header['api-key']=this.#apiKey
    }

    /**
     * getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp=Date.now();
        const endpoint=`/api/v1/user/wallet`;
        const signature=createSignature(ExchangeInfo.BitMex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['api-expires']=timestamp;
        this.#header['api-signature']=signature;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`bitmex.future.account.getAccountBalance.url:${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                response.success = true;
                response.data = {
                    ename:this.#name,
                    excahgne:'bitmex',
                    balances: [{
                        asset:  res.data.currency.toUpperCase(),
                        available: res.data.amount,
                        balance: res.data.amount
                    }],
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitmex.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.name;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`bitmex.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`bitmex.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        }catch(error){
            logger.error(`bitmex.future.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}
