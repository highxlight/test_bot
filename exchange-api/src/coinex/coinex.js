const {Spot} = require('./spot/spot');
const {Future} = require('./future/future');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');
/**
 * CoinEx entry file
 * Authenticating Request in CoinEx API
 * All API request headers need to add Content-Type: "application/json" and User-Agent:
 * APIs that require signature need to add authorization in the header
 * All Requests and Responses are transmitted in the format of json
 * Account and transaction-related API interfaces requires signature, while market-related API interfaces do not need signature
 * Each interface has its own authorization type, which determines what kind of authorization should be performed when accessing.
 * The interface requiring signature will be specified in the description. If there is no special statement, it means it doesn’t require signature by default.
 *
 * Sort parameters alphabetically
 * Add "&secret_key=your_secret_key" after the sorted string
 * TUse 32-bit MD5 encrypt and capitalize and put it in the request header authorization
 */

class CoinEx{
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     */
    constructor({name, apiKey,secretKey}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.bitmart){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, ExchangeInfo.CoinEx[environment].baseURL,ExchangeInfo.CoinEx[environment].socketURL,3000);
        this.future=new Future(name, apiKey, secretKey, ExchangeInfo.CoinEx[environment].futureURL,ExchangeInfo.CoinEx[environment].futureSocketURL,3000);
    }

}

module.exports = {CoinEx}