const {Future} = require('./future/future');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * BitMex entry file
 * Authenticating Requests on BitMEX API
 * Authentication is done by sending the following HTTP headers
 * api-expires: A UNIX timestamp after which the request is no longer valid. This is to prevent replay attacks.
 *              UNIX timestamps are in seconds. For example, 2018-02-08T04:30:37Z is 1518064237.
 * api-key: Your public API key. This the id param returned when you create an API Key via the API.
 * api-signature: A signature of the request you are making. It is calculated as hex(HMAC_SHA256(apiSecret, verb + path + expires + data))
 */

class BitMex{
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
        this.future=new Future(name, apiKey, secretKey,ExchangeInfo.BitMex[environment].futureURL, ExchangeInfo.BitMex[environment].socketURL,3000);
    }

}

module.exports = {BitMex}
