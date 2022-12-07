const {axios, createSignature, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'PF-API-KEY': '', //APIKey
        'PF-API-SIGN': '', // signature
        'PF-API-TIMESTAMP': '',
        'PF-API-PASSPHRASE': ''
    }
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {string} passphrase
     * @param {Number} timeout
     */
    constructor(name, apiKey,secretKey, passphrase, endpoint, timeout){
        this.axiosInstance=axios.create({baseURL:`${endpoint}`, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#header['PF-API-KEY']=this.#apiKey;
        this.#header['PF-API-PASSPHRASE']= passphrase;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="future"
        const timestamp= Date.now();
        const endpoint=`/api/v1/account-overview`;
        let queryString = `${timestamp}GET${endpoint}''`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['PF-API-SIGN']=signature;
        this.#header['PF-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`poloniex.future.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint, {
                headers:this.#header
            }).then(res=>{
                if(res.data.code === "200000"){
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        exchange:'poloniex',
                        balances: [{
                            asset: res.data.data.currency,
                            available: res.data.data.availableBalance,
                            balance: res.data.data.marginBalance
                        } ],
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloniex.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`poloniex.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`poloniex.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.future.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}