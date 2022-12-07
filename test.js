const Decimal = require("decimal.js");
const _ = require("lodash");
const Bot = require("./bot");

const config = require("./config");

const exConfig = require("./exchange-api/config");

exConfig.envConfg.binance = true;

const { Binance } = require("./exchange-api/exchange");

const binanceEx = new Binance({
    ...config.exchange.binance,
});

const bot = new Bot(binanceEx, config.bot);

(async () => {
    // const accountBalance = await bot.getAccountBalance();
    await bot.createOrder("spot", "sell", "market", {
        quantity: "0.0084",
    });

    // const position = await bot.getPosition();

    // const usdt = accountBalance.spot.find((item) => item.asset === "USDT");
    // const eth = accountBalance.spot.find((item) => item.asset === "ETH");

    // console.log(usdt, eth, position);
})();
