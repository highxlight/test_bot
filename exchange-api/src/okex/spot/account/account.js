const {axios, createSignature, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #passphrase='';
    #name = '';
    #header={
        'OK-ACCESS-KEY': '', //APIKey
        'OK-ACCESS-SIGN': '', // signature
        'OK-ACCESS-TIMESTAMP': '', // timestamp
        'OK-ACCESS-PASSPHRASE': '', //You specified when you created the API key
    }
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */
    constructor(name, apiKey,secretKey, passphrase, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#passphrase=passphrase
        this.#header['OK-ACCESS-KEY']=this.#apiKey;
        this.#header['OK-ACCESS-PASSPHRASE']=this.#passphrase;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp=new Date().toISOString();
        const endpoint='/api/v5/account/balance';
        const signature=createSignature(ExchangeInfo.Okex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['OK-ACCESS-SIGN']=signature;
        this.#header['OK-ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`okex.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === '0'){
                    let details = res.data.data[0].details;
                    let balances = [];
                    details.forEach(item=>{
                        let dicData = {
                            asset: item.ccy,
                            available: item.availBal,
                            locked: item.ordFrozen,
                            balance: item.cashBal
                        }
                        balances.push(dicData);
                    })
                    response.success = true;
                    response.data ={
                        ename: this.#name,
                        exchange:'okex',
                        balances: balances,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: res.data.msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'okex.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`okex.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`okex.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`okex.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}