const {axios, createSignature, ExchangeInfo, dataCalculation, logger} = require("../../../utils/utils");



class Account{

    #apiKey='';
    #secretKey='';
    #SignatureMethod = 'HmacSHA256';
    #SignatureVersion = 2;
    #name='';
    #baseUrl='';
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
     * Get account ID
     * @returns
     */
    async getAccountId(){
        const method='GET';
        const timestamp = new Date().toISOString().replace(/\..+/, '');
        let queryString = 'AccessKeyId='+this.#apiKey
            +'&SignatureMethod='+this.#SignatureMethod
            +'&SignatureVersion='+this.#SignatureVersion
            +'&Timestamp='+encodeURIComponent(timestamp);
        const signature = createSignature(ExchangeInfo.Huobi.name,
            this.#secretKey,
            queryString,
            method,
            '/v1/account/accounts',
            '',
            '',
            this.#baseUrl);

        queryString += '&Signature=' + encodeURIComponent(signature);
        let response = {
            success:false,
            data:null
        }
        try{
            let endpoint =`/v1/account/accounts?${queryString}`;
            logger.debug(`huobi.spot.account.getAccountId.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.status === 'ok') {
                    res.data.data.forEach(item => {
                        if (item.type.toLowerCase() === 'spot') {
                            response.success = true;
                            response.data = item
                        }
                    })
                }else{
                    response.data = {
                        code: res.data['err-code'],
                        msg: res.data['err-msg']
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'huobi.spot.account.getAccountId:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.status;
                    dicData.msg = err.response.data.message;
                }
                response.data = dicData;
                logger.error(`huobi.spot.account.getAccountId.err: ${err}`);
            })
            logger.info(`huobi.spot.account.getAccountId.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`huobi.spot.account.getAccountId.error: ${error}`);
            return response;
        }
    }

    /**
     *  getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        // the process to get the account balance is complcated, as it cannot get the balance directly.
        // therefore, it is required to get the id of the account first, then use it to get the balance
        let result = await this.getAccountId();
        let response = {
            success:false,
            data:null
        }
        if(result.success){
            let item = result.data;
            const accountId = item.type==='spot' ? item.id : '';
            const method='GET';
            const timestamp = new Date().toISOString().replace(/\..+/, '');
            let queryString = 'AccessKeyId='+this.#apiKey
                +'&SignatureMethod='+this.#SignatureMethod
                +'&SignatureVersion='+this.#SignatureVersion
                +'&Timestamp='+encodeURIComponent(timestamp);
            const signature = createSignature(ExchangeInfo.Huobi.name,
                this.#secretKey,
                queryString,
                method,
                `/v1/account/accounts/${accountId}/balance`,
                '',
                '',
                this.#baseUrl);

            queryString += '&Signature=' + encodeURIComponent(signature);
            try{
                let endpoint =`/v1/account/accounts/${accountId}/balance?${queryString}`;
                logger.debug(`huobi.spot.account.getAccountBalance.url: ${endpoint}`);
                await this.axiosInstance.get(endpoint).then(res=>{
                    if(res.data.status === 'ok'){
                        let balances = [];
                        let result  = res.data.data.list
                        result.forEach(item=>{
                           result.forEach(data=>{
                               if(item.type === 'trade' && data.type === 'frozen' && item.currency === data.currency){
                                    let dicData = {
                                        asset: item.currency.toUpperCase(),
                                        available: item.balance,
                                        locked: data.balance,
                                        balance: dataCalculation(item.balance, data.balance, '+')
                                    }
                                    balances.push(dicData);
                                    return;
                               }
                           })
                        })
                        response.success =true;
                        response.data = {
                            ename: this.#name,
                            exchange:'huobi',
                            balances: balances,
                            rawData: res.data
                        }
                    }else{
                        response.data = {
                            code: res.data['err-code'],
                            msg: res.data['err-msg']
                        }
                    }
                }).catch(err=>{
                    let dicData = {
                        code:400,
                        msg: 'huobi.spot.account.getAccountBalance:unknown error'
                    }
                    if(err.response){
                        dicData.code = err.response.data.status;
                        dicData.msg = err.response.data.message;
                    }
                    response.data = dicData;
                    logger.error(`huobi.spot.account.getAccountBalance.err: ${err}`);
                })
                logger.info(`huobi.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
                return response;
            } catch (error) {
                logger.error(`huobi.spot.account.getAccountBalance.error: ${error}`);
                return response;
            }
        }else{
            response.data = result.data;
        }
        return response;
    }
}
module.exports = {Account}