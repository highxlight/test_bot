const {axios, createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Account{

    #apiKey='';
    #secretKey='';
    #name='';
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
     * getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const timestamp=Date.now().toString();
        var queryString='api_key='+this.#apiKey
            +'&timestamp='+timestamp;

        const signature=createSignature(ExchangeInfo.Bybit.name,
            this.#secretKey,
            queryString);

        queryString+='&sign='+signature;
        logger.debug(`bybit.spot.account.getAccountBalance.req:${queryString}`);
        let response = {
            success:false,
            data:null
        };
        try{
            let endpoint = `/spot/v1/account?${queryString}`;
            logger.debug(`bybit.spot.account.getAccountBalance.url:${endpoint}`);
            await this.axiosInstance.get(endpoint).then(res=>{
                if(res.data.ret_code === 0){
                    let balances = res.data.result.balances;
                    let lists = [];
                    balances.forEach(item =>{
                        let dicData = {
                            asset: item.coin,
                            available: item.free,
                            locked: item.locked,
                            balance: item.total
                        }
                        lists.push(dicData)
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        exchange:'bybit',
                        balances: lists,
                        rawData: res.data
                    }
                }else{
                    let dicData= {
                        code: res.data.ret_code,
                        msg: res.data.ret_msg
                    }
                    response.data = dicData
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'bybit.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.status;
                    dicData.msg = err.response.statusText;
                }
                response.data = dicData;
                logger.error(`bybit.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`bybit.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`bybit.spot.account.getAccountBalance.error: ${error}`);
            return response
        }
    }
}
module.exports = {Account}
