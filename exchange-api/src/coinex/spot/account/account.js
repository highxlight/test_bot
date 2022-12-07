const {axios, createSignature, dataCalculation, ExchangeInfo} = require("../../../utils/utils");
const logger = require('../../../utils/logger');

class Account{

    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
        "post": {"Content-Type": "application/json"},
        "authorization":""
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
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method="GET"
        const timestamp= Date.now();
        const endpoint='/balance/info';
        let requestBody = {
            access_id: this.#apiKey,
            tonce: timestamp
        }
        const signature=createSignature(ExchangeInfo.CoinEx.name,
            this.#secretKey,
            '',
            method,
            endpoint,
            timestamp, requestBody);
        this.#header['authorization']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`coinex.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }, requestBody).then(res=>{
                if(res.data.code === 0){
                    let balances = [];
                    let result = res.data.data;
                    for(let key in result){
                        let dicData = {
                            asset: key,
                            available: result[key].available,
                            locked:  result[key].frozen,
                            balance: dataCalculation(result[key].available, result[key].frozen, '+')
                        }
                        balances.push(dicData);
                    }
                    response.success = true;
                    response.data ={
                        ename: this.#name,
                        exchange:'coinex',
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
                    msg: 'coinex.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`coinex.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`coinex.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`coinex.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}