const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');
/**
 * OKEx entry file
 * Authenticating Request in Okex API
 * All private REST requests must contain the following headers:
 * - OK-ACCESS-KEY The APIKey as a String.
 * - OK-ACCESS-SIGN The Base64-encoded signature (see Signing Messages subsection for details).
 * - OK-ACCESS-TIMESTAMP The timestamp of your request.
 * - OK-ACCESS-PASSPHRASE The passphrase you specified when creating the APIKey.
 * All requests are HTTPS-based. The Content-Type in the request header should be set as application/json
 *
 * The OK-ACCESS-SIGN header is generated as follows:
 * 1. create a prehash string of timestamp + method + requestPath + body (where + represents String concatenation)
 * 2. prepare the Secret
 * 3. sign the prehash string with the Secret using the HMAC SHA256
 * 4. encode the signature in the Base64 format
 * 5. The request method should be UPPER CASE, i.e. GET and POST.
 * 6. The requestPath is the path of requesting an endpoint.
 * 7. The timestamp value is the same as the OK-ACCESS-TIMESTAMP header with nanosecond precision.
 */

class Okex{
    /**
     *
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
            if(envConfg.okex){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, passphrase, ExchangeInfo.Okex[environment].baseURL,ExchangeInfo.Okex[environment].socketURL,3000);
    }

}

module.exports = {Okex}