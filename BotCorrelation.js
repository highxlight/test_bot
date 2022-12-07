let Bot = require('./bot');
const exchanges = require('./exchange-api/exchange');

class BotCorrelation {
    constructor(name, configAll) {
        this.name = name;
        let {
            exchange: { type, config },
        } = configAll;
        const exchangeObj = new exchanges[type](config);
        this.bot = new Bot(exchangeObj, configAll.strategyParams);
    }

    start() {
        this.bot.start();
    }
}

module.exports = BotCorrelation;
