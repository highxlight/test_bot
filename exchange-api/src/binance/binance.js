const {Spot} = require('./spot/spot');
const {Future} = require('./future/future');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Binance entry file
 * Authenticating Requests on Binance API
 * - the api key is passed via the X-MBX-APIKEY header
 * - a HMAC SHA 256 signature that is append after the query string or request body
 *
 * Each signature is required a timestamp which its timestamp should be in milliseconds, also the parameters of the query or the string form of the request parameters
 *
 * Sending Request to Binance Exchange:
 * It is recommended to send request parameter in form of query string whatever the HTTP request method.
 */

class Binance{
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} futureApiKey The future api key used in authentication
     * @param {string} futureSecretKey The  future secret key to encrypt the data into HMAC SHA256 signature
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor({name, apiKey, secretKey, futureApiKey, futureSecretKey}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.binance){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey,ExchangeInfo.Binance[environment].baseURL, ExchangeInfo.Binance[environment].socketURL,3000);
        this.future = new Future(name, futureApiKey, futureSecretKey,ExchangeInfo.Binance[environment].futureURL, ExchangeInfo.Binance[environment].futureSocketURL,3000);
    }

}

module.exports = {Binance}
