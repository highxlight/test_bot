const {Spot} = require('./spot/spot');
const {Future} = require('./future/future');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');
/**
 * OKEx entry file
 * Authenticating Request in Okex API
 * All private REST requests must contain the following headers:
 *  Your API key.
 * Sign - The query's POST data signed by your key's "secret" according to the HMAC-SHA512 method.
 *  Additionally, all queries must include a "nonce" or "timestamp" POST parameter.
 *  Private HTTP endpoints are authenticated using HMAC-SHA512 signed POST request.
 *  Private HTTP endpoints also require a nonce, which must be an integer greater than the previous nonce used.
 *  There is no requirement that nonces increase by a specific amount,
 *  so the current epoch time in milliseconds is an easy choice. As each API key has its own nonce tracking,
 *  using a different key for each client process can greatly simplify nonce management.
 */

class PoloNiex{
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
     */
    constructor({name, apiKey,secretKey, futureApiKey, futureSecretKey, futurePassphrase}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.okex){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, ExchangeInfo.PoloNiex[environment].baseURL,ExchangeInfo.PoloNiex[environment].socketURL,3000);
        this.future=new Future(name, futureApiKey, futureSecretKey, futurePassphrase, ExchangeInfo.PoloNiex[environment].futureURL,3000);
    }

}

module.exports = {PoloNiex}