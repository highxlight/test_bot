const {Market} = require("./market/market");
// const {Socket} = require("./socket/socket");
const {Account} = require("./account/account");
const {Order} = require("./order/order");
const {logger} = require("../../utils/utils");


class Spot {

    constructor(name, apiKey, secretKey, passphrase, endpoint, socketUrl, timeout) {
        logger.debug(`zeroX.spot.url:${endpoint}`);
        this.market = new Market(endpoint, timeout);
        // this.socket = new Socket(apiKey, secretKey, endpoint, socketUrl, 3000);
        this.account = new Account(name, apiKey, secretKey, passphrase, endpoint, timeout);
        this.order = new Order(name, apiKey, secretKey, passphrase, endpoint, timeout);
    }
}
module.exports = {Spot}