const {axios, createSignature, ExchangeInfo, randString, logger} = require("../../../utils/utils");

class Account{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'Authorization':'',
        'Content-Type': 'application/json'
    }
    /**
     *
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
    }

    /**
     * getAccountBalance
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp=Date.now();
        const endpoint=`/api/v2/private/get_deposits/currency=USDT`;
        const nonce=randString(6);
        const signature=createSignature(ExchangeInfo.Deribit.name,
            this.#secretKey,
            nonce,
            method,
            endpoint,
            timestamp);
        this.#header['Authorization']=`deri-hmac-sha256 id=${this.#apiKey},ts=${timestamp},sig=${signature},nonce=${nonce}`;
        let response = {
            success:false,
            data:null
        };
        try{
            logger.debug(`deribit.future.account.getAccountBalance:url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                response.success = true;
                response.data ={
                    ename: this.#name,
                    exchange: 'deribit',
                    balances: [],
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'deribit.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.error.code;
                    dicData.msg = err.response.data.error.message;
                }
                response.data = dicData;
                logger.error(`deribit.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`deribit.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`deribit.future.account.getAccountBalance.error: ${error}`);
            return response
        }
    }

}
module.exports = {Account}