const {axios, createSignature, dataCalculation, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name='';
    #header={
        'X-MBX-APIKEY': '', //APIKey
        'Content-type': 'application/x-www-form-urlencoded', // signature
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
        this.#header['X-MBX-APIKEY']=this.#apiKey;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp= Date.now();
        let endpoint='/api/v1/account';
        let queryString = `timestamp=${timestamp}`;
        const signature=createSignature(ExchangeInfo.BitMart.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            timestamp);
        endpoint = `${endpoint}?${queryString}&signature=${signature}`
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`bitrue.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let balances = [];
                res.data.balances.forEach(item=>{
                    let dicData = {
                        asset: item.asset.toUpperCase(),
                        available: item.free,
                        locked: item.locked,
                        balance: dataCalculation(item.free, item.locked, '+')
                    }
                    balances.push(dicData);
                })
                response.success = true;
                response.data ={
                    ename:this.#name,
                    exchange:'bitrue',
                    balances: balances,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bitrue.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`bitrue.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`bitrue.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bitrue.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}