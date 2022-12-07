const {Market} =require ("./market/market");
const {Account} =require ("./account/account");
const {Order} =require ("./order/order");
const {Socket} = require('./socket/socket');
const {logger} = require("../../utils/utils");

class Spot {
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {string} socketUrl
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, endpoint, socketUrl, timeout) {
        logger.debug(`gateio.spot.url: ${endpoint}`);
        this.market = new Market(apiKey, secretKey, endpoint, timeout);
        this.account = new Account(name, apiKey, secretKey, endpoint, timeout);
        this.order = new Order(name, apiKey, secretKey, endpoint, timeout);
        this.socket = new Socket(name, apiKey, secretKey, endpoint, socketUrl, timeout)
    }
}
module.exports = {Spot}