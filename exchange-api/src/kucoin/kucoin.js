const {Future} = require('./future/future');
const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Kucoin entry file
 * Authenticating Request in KuCoin API
 * all private request should be authenticated
 * things to included in the header:
 * - KC-API-KEY stores API key
 * - KC-API-SIGN stores the base64-encoded signature
 * - KC-API-TIMESTAMP stores the timestamp for the request
 * - KC-API-PASSPHRASE stores the passphrase specified when creating API key
 * - KC-API-KEY-VERSION stores the version of the API key
 *
 * Signing a Request
 * Order of the presigned string:
 * 1. timestamp
 * 2. HTTP method in uppercase, for GET and DELETE, the endpoint should be contained within the endpoint
 * 3. endpoint
 * 4. request body, "" for empty
 */

class Kucoin{
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     *  @param {string} futureApikey The future api key used in authentication
     * @param {string} futureSecretKey The secret future key to encrypt the data into HMAC SHA256 signature
     * @param {string} futurePassphrase stores the future passphrase specified when creating API key
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor({name, apiKey,secretKey, passphrase, futureApiKey, futureSecretKey, futurePassphrase}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.kucoin){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, passphrase, ExchangeInfo.Kucoin[environment].baseURL, ExchangeInfo.Kucoin[environment].socketURL, 3000);
        this.future=new Future(name, futureApiKey, futureSecretKey, futurePassphrase, ExchangeInfo.Kucoin[environment].futureURL,3000);
    }

}

module.exports = {Kucoin}
