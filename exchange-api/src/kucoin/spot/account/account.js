const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Account {

    #apiKey = '';
    #secretKey = '';
    #passphrase = '';
    #name='';
    #header = {
        'KC-API-SIGN': '',
        'KC-API-TIMESTAMP': '',
        'KC-API-KEY': '',
        'KC-API-PASSPHRASE': '',
        'KC-API-VERSION': '2'
    }

    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, passphrase, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.#name = name;
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.#header['KC-API-KEY'] = this.#apiKey;
        this.#header['KC-API-PASSPHRASE'] = this.#passphrase;
    }

    async getAccountBalance(){
        const timestamp=Date.now().toString();
        const signature=createSignature(ExchangeInfo.Kucoin.name,
            this.#secretKey,
            '',
            'GET',
            '/api/v1/accounts',
            timestamp);

        this.#header['KC-API-SIGN']=signature;
        this.#header['KC-API-TIMESTAMP']=timestamp;
        let response = {
            success:false,
            data:null
        }
        try{
            let endpoint = `/api/v1/accounts`;
            logger.debug(`kucoin.spot.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers: this.#header
            }).then(res=>{
                if(res.data.code === '200000'){
                    let balances = [];
                    res.data.data.forEach(item=>{
                        if(item.type === 'main'){
                            let dicData={
                                asset:item.currency,
                                available: item.available,
                                locked: item.holds,
                                balance: item.balance
                            }
                            balances.push(dicData);
                        }
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        exchange: 'kucoin',
                        balances: balances,
                        rawData: res.data
                    }
                }else{
                    response.data = res.data;
                }

            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'kucoin.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.code;
                    dicData.msg = err.response.data.msg;
                }
                response.data = dicData;
                logger.error(`kucoin.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`kucoin.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`kucoin.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }

}
module.exports = {Account}