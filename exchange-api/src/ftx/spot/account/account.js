const {axios, createSignature, ExchangeInfo, dataCalculation, logger} = require("../../../utils/utils");

class Account{

    #apiKey = '';
    #secretKey = '';
    #name = '';
    #header={
        'FTX-KEY':'',
        'FTX-SIGN':'',
        'FTX-TS':''
    };
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
        this.#header['FTX-KEY']=this.#apiKey;
    }

    /**
     * getAccountBalance
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAccountBalance(){
        const timestmap=Date.now().toString();
        const endpoint='/api/wallet/all_balances';
        const signature=createSignature(ExchangeInfo.Ftx.name,
                                        this.#secretKey,
                                        '',
                                        'GET',
                                        endpoint,
                                        timestmap);

        this.#header['FTX-TS']=timestmap;
        this.#header['FTX-SIGN']=signature;
        let response = {
            success:false,
            data:null
        }
        try{
            logger.debug(`ftx.spot.account.get24hTickerStatistic.url: ${endpoint}`);
            await this.axiosInstance.get(endpoint,{
                headers:this.#header
            }).then(res=>{
                if(res.data.success){
                    let balances = [];
                    res.data.result.main.forEach(item=>{
                        let dicData = {
                            asset:  item.coin,
                            available: item.free,
                            locked: dataCalculation(item.total, item.free, '-'),
                            balance: item.total
                        }
                        balances.push(dicData);
                    })
                    response.success = true;
                    response.data = {
                        ename: this.#name,
                        exchange: 'ftx',
                        balances: balances,
                        rawData: res.data
                    }
                }else{
                    response.success = false;
                    response.data = {
                        code: 400,
                        msg: res.data.result
                    }
                }
            }).catch(err=>{
                let dicData = {
                    code:400,
                    msg: 'ftx.spot.account.getAccountBalance:unknown error'
                }
                if(err.response){
                    dicData.code = err.response.data.success;
                    dicData.msg = err.response.data.error;
                }
                response.data = dicData;
                logger.error(`ftx.spot.account.getAccountBalance.err: ${err}`);
            })
            logger.info(`ftx.spot.account.getAccountBalance.response: ${JSON.stringify(response)}`)
            return response;
        } catch (error) {
            logger.error(`ftx.spot.account.getAccountBalance.error: ${error}`);
            return response;
        }
    }



}
module.exports = {Account}
