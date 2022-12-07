const {axios, createSignature, dataCalculation, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');
const errorCode = require('../errorCode')

class Account{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'ACCESS-KEY': '', //APIKey
        'ACCESS-SIGN': '', // signature
        'ACCESS-TIMESTAMP': '',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
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
        this.#header['ACCESS-KEY']=this.#apiKey;

    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp= parseInt(Date.now() / 1000);
        let endpoint = `/spot/assets`;
        const signature=createSignature(ExchangeInfo.Digifinex.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp);
        this.#header['ACCESS-SIGN']=signature;
        this.#header['ACCESS-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`digifinex.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint, {
                headers:this.#header
            }).then(res=>{
                if(res.data.code === 0){
                    let details = res.data.list;
                    let balances = [];
                    details.forEach(item=>{
                        let dicData = {
                            asset: item.currency,
                            available: item.free,
                            locked: dataCalculation(item.total, item.free, '+'),
                            balance: item.total,
                        }
                        balances.push(dicData);
                    })
                    response.success = true;
                    response.data ={
                        ename: this.#name,
                        exchange:'digifinex',
                        balances: balances,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: res.data.code,
                        msg: errorCode[res.data.code]
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'digifinex.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`digifinex.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`digifinex.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`digifinex.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}