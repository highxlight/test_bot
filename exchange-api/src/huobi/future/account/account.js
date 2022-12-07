const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Account{

    #apiKey='';
    #secretKey='';
    #SignatureMethod = 'HmacSHA256';
    #SignatureVersion = 2;
    #name='';
    #baseUrl = ''
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
        this.#baseUrl = endpoint;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
    }

    /**
     * getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const method='POST';
        const endpoint='/linear-swap-api/v1/swap_account_info';
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        let queryString='AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);
        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            endpoint,
            '',
            '',
            this.#baseUrl);
        queryString += '&Signature=' + encodeURIComponent(signature);
        let requestBody={
            'Signature':signature
        }
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`huobi.future.account.getAccountBalance.url: ${endpoint}?${queryString}, params: ${requestBody}`);
            await this.axiosInstance.post(`${endpoint}?${queryString}`, requestBody).then(res=>{
                if(res.data.status === 'ok'){
                    let balances = [];
                    res.data.data.forEach(item=>{
                        let dicData = {
                            asset: item.margin_asset,
                            available: item.margin_available,
                            balance: item.margin_balance
                        }
                        balances.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        exchange:'huobi',
                        balances: balances,
                        rawData: res.data
                    }
                }else{
                    response.data = {
                        code: res.data.err_code,
                        msg:res.data.err_msg
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`huobi.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.future.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports = {Account}