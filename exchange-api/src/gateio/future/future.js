const {Market} =require ("./market/market");
const {Account} =require ("./account/account");
const {Order} =require ("./order/order");
const {Socket} = require('./socket/socket');
const {logger} = require("../../utils/utils");

class Future {
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {string} futureUrl
     * @param {string} socketUrl
     * @param {Number} timeout
     * It will initialize the object with creating axios instance for http connection (for spot and future respectively)
     * And store the information for authentication within the class and use when needed.
     */
    constructor(name, apiKey, secretKey, endpoint, futureUrl, socketUrl, timeout) {
        logger.debug(`gateio.future.url: ${futureUrl}`);
        this.market = new Market(apiKey, secretKey, endpoint, timeout);
        this.account = new Account(name, apiKey, secretKey, endpoint, futureUrl, timeout);
        this.order = new Order(name, apiKey, secretKey, endpoint, timeout);
        this.socket = new Socket(name, apiKey, secretKey, futureUrl, socketUrl, timeout)
    }
}
module.exports = {Future}