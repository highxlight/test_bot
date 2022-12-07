const {Future} = require('./future/future');
const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Aax entry file
 * Authentication is done by sending the following HTTP headers:
 * X-ACCESS-KEY: Your public API key.
 * X-ACCESS-NONCE: A UNIX timestamp in milliseconds after which the request is no longer valid. This is to prevent replay attacks.
 * X-ACCESS-SIGN: Signature for your API request. It is calculated as follows: HEX(HMAC_SHA256(apiSecret, str(nonce) + ':' + verb + path + data)).
 *  The data part of the HMAC construction should be exactly equal to the raw message body you wish to send to the server and needs to be a JSON-encoded.
 */

class Aax{
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
            if(envConfg.bitmex){
                environment = 'main';
            }
        }
        this.future=new Future(name, apiKey, secretKey, ExchangeInfo.Aax[environment].baseURL,ExchangeInfo.Aax[environment].privateSocketURL, ExchangeInfo.Aax[environment].socketURL,3000);
        this.spot=new Spot(name, apiKey, secretKey, ExchangeInfo.Aax[environment].baseURL,ExchangeInfo.Aax[environment].privateSocketURL,ExchangeInfo.Aax[environment].socketURL,3000);
    }

}

module.exports = {Aax}
