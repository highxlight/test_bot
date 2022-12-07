const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');
/**
 * BitMart entry file
 * Authenticating Request in BitMart API
 * All REST request headers must include the following:
 * - X-BM-KEY: Access Key of type string.
 * - X-BM-SIGN: Use HmacSHA256 signature (see Signature).
 * - X-BM-TIMESTAMP: The timestamp of the request. (UTC0 time zone timestamp, accurate to milliseconds)
 * For interfaces using the GET and DELETE methods, the content can be sent in two forms: application/json or application/x-www-form-urlencoded.
 * The parameter must be sent in the query string. (The order of the parameters is not required.)
 *
 * For interfaces using the POST and PUT methods, the content can be sent in application/json form. (The order of the parameters is not required.
 * The timestamp of the request. (UTC0 time zone Unix timestamp accurate to milliseconds)
 * The request header of X-BM-SIGN is obtained by encrypting the timestamp + "#" + memo + "#" + queryString, and the secret key using the HMAC SHA256 method.
 * Among them, the value of timestamp is the same as the X-BM-TIMESTAMP in request header.
 */

class BitMart{
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     */
    constructor({name, apiKey,secretKey, passphrase}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.bitmart){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, passphrase, ExchangeInfo.BitMart[environment].baseURL,ExchangeInfo.BitMart[environment].socketURL,3000);
    }

}

module.exports = {BitMart}