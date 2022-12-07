const {Market} = require("./market/market");
const {Socket} = require("./socket/socket");
const {Account} = require("./account/account");
const {Order} = require("./order/order");
const {logger} = require("../../utils/utils");

class Future {
    /**
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {string} socketUrl
     * @param {string} privateSocketURL
     * @param {Number} timeout
     */
    constructor(name, apiKey, secretKey, endpoint, privateSocketURL, socketUrl, timeout) {
        logger.debug(`aax.future.url:${endpoint}`);
        this.market = new Market(apiKey, secretKey, endpoint, timeout);
        this.socket = new Socket(name, apiKey, secretKey, endpoint, privateSocketURL, socketUrl, timeout);
        this.account = new Account(name, apiKey, secretKey, endpoint, timeout);
        this.order = new Order(name, apiKey, secretKey, endpoint, timeout);
    }
}
module.exports = {Future}