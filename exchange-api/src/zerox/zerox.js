const {Spot} = require('./spot/spot');
const { zerox } = require('../../config');
const {ExchangeInfo} = require('../utils/utils');

class Zerox{

    constructor({name, apiKey, secretKey, passphrase}){
        let environment = zerox.netway;
        this.spot=new Spot(name, apiKey, secretKey, passphrase, ExchangeInfo.Zerox[environment], ExchangeInfo.Zerox.socketURL, 3000);
    }

}

module.exports = {Zerox}
