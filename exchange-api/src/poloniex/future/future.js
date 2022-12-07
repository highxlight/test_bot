const {Market} = require("./market/market");
const {Socket} = require("./socket/socket");
const {Account} = require("./account/account");
const {Order} = require("./order/order");
const {logger} = require("../../utils/utils");

class Future {
    /**
     *
     * @param {string} name
     * @param {string} apiKey The api key used in authentication
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA512 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {string} passphrase
     * @param {Number} timeout
     */
    constructor(name, apiKey, secretKey, passphrase, endpoint, timeout) {
        logger.debug(`poloniex.future.url:${endpoint}`);
        this.market = new Market(apiKey, secretKey, passphrase, endpoint, timeout);
        this.socket = new Socket(name, apiKey, secretKey, passphrase, endpoint, timeout);
        this.account = new Account(name, apiKey, secretKey, passphrase, endpoint, timeout);
        this.order = new Order(name, apiKey, secretKey, passphrase, endpoint, timeout);
    }
}
module.exports = {Future}