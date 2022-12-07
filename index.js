const Bot = require("./bot");

const config = require("./config");

const bot = new Bot(config.exchange, config.bot);

bot.start();