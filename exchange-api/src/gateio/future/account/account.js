const {axios,createSignature, ExchangeInfo, logger} = require("../../../utils/utils");

class Account{
    #apiKey='';
    #secretKey='';
    #name = '';
    #header={
        'KEY':'',
        'Timestamp':'',
        'SIGN':'',
    }
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey,secretKey, endpoint, futureUrl, timeout){
        this.axiosInstance=axios.create({baseURL:futureUrl,timeout: timeout});
        this.axiosWallet=axios.create({baseURL:endpoint,timeout: timeout});
        this.#name = name;
        this.#apiKey=apiKey;
        this.#secretKey=secretKey;
        this.#header.KEY=this.#apiKey;

    }

    /**
     * getAccountBalance
     * @returns {Promise<*>}
     */
    async getAccountBalance(){
        const timestamp=Math.floor(Date.now() / 1000);
        const endpoint='/api/v4/wallet/total_balance';
        const signature=createSignature(ExchangeInfo.Gateio.name,
            this.#secretKey,
            '',
            'GET',
            endpoint,
            timestamp);

        this.#header['Timestamp']=timestamp;
        this.#header['SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`gateio.future.account.getAccountBalance.url: ${endpoint}`);
            await this.axiosWallet.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                let balances = []
                if(res.data.details){
                    let result = res.data.details.futures;
                    let dicData = {
                        asset: result.currency,
                        available: result.amount,
                        balance: result.amount
                    }
                    balances.push(dicData)
                }
                response.success = true;
                response.data ={
                    ename: this.#name,
                    exchange:'gateio',
                    balances: balances,
                    rawData: res.data
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'gateio.future.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.label;
                    dicData.msg = err.response.data.message;
                    if('detail' in err.response.data){
                        dicData.msg = err.response.data.detail;
                    }
                }
                response.data = dicData;
                logger.error(`gateio.future.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`gateio.future.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`gateio.future.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }
}
module.exports={Account}
