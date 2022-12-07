const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');
/**
 * BitMart entry file
 * Authenticating Request in BitMart API
 * SIGNED endpoints require an additional parameter, signature, to be sent in the query string or request body.
 Endpoints use HMAC SHA256 signatures. The HMAC SHA256 signature is a keyed HMAC SHA256 operation. Use your secretKey as the key and totalParams as the value for the HMAC operation.
 The signature is not case sensitive.
 totalParams is defined as the query string concatenated with the request body.
 */

class BitRue{
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase stores the passphrase specified when creating API key
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
        this.spot=new Spot(name, apiKey, secretKey, ExchangeInfo.BitRue[environment].baseURL,ExchangeInfo.BitRue[environment].socketURL,3000);
    }

}

module.exports = {BitRue}