const {Future} = require('./future/future');
const {Spot} = require('./spot/spot');
const { ExchangeInfo, allEnvConfig, envConfg } = require('../utils/utils');

/**
 * Bybit entry file
 * How to Authenticate Request:
 * things to included:
 * - api key
 * - timestamp, which range from server_time - recv_window tpo server_time+1000, in milliseconds
 * - sign
 *
 * How to Sign:
 * 1. contactenate all the public parameters in the query string format and ordered in alphabetical order
 * 2. hash it using Hmac SHA256 algorithm and convert it into a hex string
 * 3. append it to the parameter string if the HTTP method is GET, append in the request body if the method is POST
 */

class Bybit {
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor({name, apiKey,secretKey}){
        let environment = 'test';
        if(allEnvConfig){
            environment = 'main';
        }else{
            if(envConfg.bybit){
                environment = 'main';
            }
        }
        this.spot=new Spot(name,apiKey, secretKey, ExchangeInfo.Bybit[environment].baseURL, ExchangeInfo.Bybit[environment].socketURL,3000);
        this.future=new Future(name, apiKey, secretKey, ExchangeInfo.Bybit[environment].futureURL, ExchangeInfo.Bybit[environment].futureSocketURL, 3000);
    }

}

module.exports = {Bybit}
