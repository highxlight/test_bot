const {Future} = require('./future/future');
const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * BitMex entry file
 * How to Authenticate Requests in Huobi
 * In URL,
 * - the API path, including the base endpoint and request endpoint but not the protocol
 * - AccessKeyId: the access key in the api key
 * - SignatureMethod: the hash method used to sign and its value is HmacSHA256
 * - SignatureVersion: indicates the version of the signature protocol, the value is 2
 * - Timestamp: the UTC time when the request is sent.
 * - parameters of the request
 * - Signature
 * Remarks:
 * - only get requests need to be signed
 *
 * How to Sign:
 * The full URL should be in the following order:
 * - protocol://baseURL+endpoint?AccessKeyId&SignatureMethod=HmacSHA256&SignatureVersion=2&Timestamp&query
 *
 * 1. the request method in uppercase and append line break, e.g. GET\n
 * 2. the baseURL appended with line break
 * 3. the endpoint appended with line break
 * 4. reorder the parameters (e.g. the order example) according to the ASCII, then encode the URL if possible, which is : -> %3A, ' ' -> %20 ,etc.
 * 5. concatenate the parameters using '&'
 * 6. assemble the parameters with others in the following order:
 *      a. request method
 *      b. baseURL
 *      c. endpoint
 *      d. re-ordered parameters
 * 7. encrypt it with the Hmac SHA256 and the secret key
 * 8. append the encrypted signature after the url and it is done!
 */

class HuoBi{
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     */
    constructor({name, apiKey,secretKey}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.huobi){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey, ExchangeInfo.Huobi[environment].baseURL, ExchangeInfo.Huobi[environment].socketURL, 3000);
        this.future=new Future(name, apiKey, secretKey, ExchangeInfo.Huobi[environment].futureURL, ExchangeInfo.Huobi[environment].futureSocketURL, 3000);
    }

}

module.exports = {HuoBi}