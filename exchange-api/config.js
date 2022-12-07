const config = {
    consoleLog: false, //whether to show logs in console
    allEnvConfig: false, // Configure all exchange environments  true: main  false: test
    envConfg:{  // Configure a single exchange environment   true: main  false: test
        binance: false,
        bitmex: false,
        bybit: false,
        deribit: false,
        ftx: false,
        gateIo: false,
        huobi: false,
        kucoin: false,
        okex: false,
        bitmart: false,
        aax: false,
        coinex: false,
        bitrue: false,
        poloniex: false,
        digifinex: false,
    },
    zerox:{
        netway: 'mainnet'   // mainnet, binance, ropsten, polygon, avalanche, fantom, celo,optimism
    }
}
module.exports = config;