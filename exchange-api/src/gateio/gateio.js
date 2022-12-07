const {Future} = require('./future/future');
const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Authenticating a request for Gate.io:
 * headers to be included:
 * - KEY to store the api key
 * - Timestamp to store the timestamp in seconds, make sure that the gap between the value and the current time
 *    does not exceed 60 seconds
 * - SIGN for the signature, which is the hexadecimal digest output of HMAC-SHA512 with secret key and the
 *    signature string
 *
 * API Signature String Generation
 * The string should be concatenated as the following:
 * HTTP_Method+"\n"+Request_URL+"\n"+Query_String+"\n"+HexEncode(SHA512(Request_Payload))+"\n"+Timestamp
 * - HTTP_Method should be in UPPERCASE
 * - Request_URL is the url path that protocol, host and port NOT INCLUDED
 * - Query_String is the query string without URL encode (i.e. no %20) it should be the same as how they are
 *    concatenated in the request but without '?'. If there is no query parameters, use "" to represent
 * - HexEncode(SHA512(Request_Payload)) is a hashed string which is created using SHA512 and the stringified request body
 *    and output its Hex encoded form, the request body can be substituted with "" if there is no request body
 * - Timestamp should be the same value in Timestamp header
 *
 *
 * Notes:
 * - Timestamp unit is in seconds
 * - DELETE request does not read request body
 */
class Gateio{
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} futureApiKey The future api key used in authentication
     * @param {string} futureSecretKey The  future secret key to encrypt the data into HMAC SHA256 signature
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor({name, apiKey,secretKey, futureApiKey, futureSecretKey}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.gateIo){
                environment = 'main';
            }
        }
        this.spot=new Spot(name, apiKey, secretKey,  ExchangeInfo.Gateio[environment].baseURL, ExchangeInfo.Gateio[environment].socketURL, 3000);
        this.future=new Future(name, futureApiKey, futureSecretKey,ExchangeInfo.Gateio[environment].baseURL, ExchangeInfo.Gateio[environment].futureURL, ExchangeInfo.Gateio[environment].futureSocketURL, 3000);
    }
}
module.exports = {Gateio}