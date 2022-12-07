const {axios, createSignature, dataCalculation, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #passphrase='';
    #name = '';
    #header={
        'X-BM-KEY': '', //APIKey
        'X-BM-SIGN': '', // signature
        'X-BM-TIMESTAMP': '', // timestamp
    }
    /**
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
        this.#header['X-BM-KEY']=this.#apiKey;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp= Date.now();
        const endpoint='/spot/v1/wallet';
        let queryString = `${timestamp}#${this.#passphrase}#''`;
        const signature=createSignature(ExchangeInfo.BitMart.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            timestamp);
        this.#header['X-BM-SIGN']=signature;
        this.#header['X-BM-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitmart.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 1000){
                    let balances = [];
                    res.data.data.wallet.forEach(item=>{
                        let dicData = {
                            asset: item.id,
                            available: item.available,
                            locked: item.frozen,
                            balance: dataCalculation(item.frozen, item.available, '+')
                        }
                        balances.push(dicData);
                    })
                    response.success = true;
                    response.data ={
                        ename: this.#name,
                        exchange:'bitmart',
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
                    msg: 'bitmart.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`bitmart.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`bitmart.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitmart.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}