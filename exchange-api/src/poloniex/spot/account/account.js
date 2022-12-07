const {axios, createSignature, ExchangeInfo, dataCalculation} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'Key': '', //APIKey
        'Sign': '' // signature
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
        this.axiosInstance=axios.create({baseURL:`${endpoint}/tradingApi`, timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#header['Key']=this.#apiKey;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp= Date.now();
        const queryString=`command=returnCompleteBalances&nonce=${timestamp}`;
        const signature=createSignature(ExchangeInfo.PoloNiex.name,
            this.#secretKey,
            queryString,
            method,
            '',
            timestamp);
        this.#header['Sign']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`poloniex.spot.account.getAccountBalance.url: ${queryString}`);
            await this.axiosInstance.post('', queryString, {
                headers:this.#header
            }).then(res=>{
                let details = res.data;
                let balances = [];
                for(let key in details){
                    let item = details[key];
                    let dicData = {
                        asset: key,
                        available: item.available,
                        locked: item.onOrders,
                        balance: dataCalculation(item.available, item.onOrders, '+')
                    }
                    balances.push(dicData);
                }
                response.success = true;
                response.data ={
                    ename: this.#name,
                    exchange:'poloniex',
                    balances: balances,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'poloniex.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`poloniex.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`poloniex.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`poloniex.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}