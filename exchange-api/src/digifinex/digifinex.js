const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Digifinex entry file
 * Authenticating Requests on Digifinex API
 * The field contentType in request header should be: application/x-www-form-urlencoded
 * All sign required endpoints must be requested with header:
 * - ACCESS-KEY User's API-KEY
 * - ACCESS-SIGN Signature
 * - ACCESS-TIMESTAMP Timestamp in seconds
 * Signature Algorithm
 * - The HMAC SHA256 is used for signature
 * - The API-Secret of specific API-KEY will be the secret key of HMAC SHA256, other parameters as the HMAC SHA256 encrypting object, the outcome string is the signature
 * - The signature is not case sensitive.
 * - When query string and request body are both passed with parameters, the input of HMAC SHA256 must be composed with query string and request body concat with '&' and the query string must be in front.
 * - The signature of specific ACCESS-KEY must be passed in the request header by ACCESS-SIGN parameter.
 */

class Digifinex{

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
            if(envConfg.deribit){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey,  ExchangeInfo.Digifinex[environment].baseURL, ExchangeInfo.Digifinex[environment].socketURL, 3000);
    }

}

module.exports = {Digifinex}