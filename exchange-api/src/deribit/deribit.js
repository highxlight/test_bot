const {Future} = require('./future/future');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Deribit entry file
 *Authenticating Requests on Deribit API
 * Authorization: deri-hmac-sha256 id=ClientId,ts=Timestamp,sig=Signature,nonce=Nonce
 * ClientId	Can be found on the API page on the Deribit website (the user can configure up to 8 different IDs - with different privileges)
 * Timestamp Time when the request was generated - given as miliseconds. It's valid for 60 seconds since generation, after that time any request with an old timestamp will be rejected.
 * Signature  Value for signature calculated as described below
 * Nonce	Single usage, user generated initialization vector for the server token
 */

class Deribit{

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
        this.future=new Future(name, apiKey, secretKey,  ExchangeInfo.Deribit[environment].baseURL, ExchangeInfo.Deribit[environment].socketURL, 3000);
    }

}

module.exports = {Deribit}