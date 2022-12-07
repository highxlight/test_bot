const {Future} = require('./future/future');
const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Ftx entry file
 * How to Authenticate Requests with FTX
 * In Header,
 * - FTX-KEY: stores the API Key
 * - FTX-TS: stores the timestamp in milliseconds
 * - FTX-SIGN: stores the SHA256 HMAC signature which is encrypted using the secret key
 *
 * How to Sign:
 * 1. request timestamp
 * 2. HTTP method in uppercase
 * 3. request endpoint, including the leading slash and any parameters but not including the hostname, query string does not include
 * 4. for POST request, also include the request body
 */

class Ftx {
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor({name, apiKey,secretKey}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.ftx){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, ExchangeInfo.Ftx[environment].baseURL, ExchangeInfo.Ftx[environment].socketURL, 3000);
        this.future=new Future(name, apiKey, secretKey,  ExchangeInfo.Ftx[environment].baseURL, ExchangeInfo.Ftx[environment].socketURL,3000);
    }

}

module.exports = {Ftx}
