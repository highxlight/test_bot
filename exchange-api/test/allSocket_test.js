const config = require('../config');
config.consoleLog = true;
config.allEnvConfig = true;

const {Binance, Kucoin, Bybit, Gateio, Okex, HuoBi, Ftx, BitMex, Deribit}  = require('../exchange');
const {binance, kuCoin, byBit, gateIo, okex, huoBi, ftx, bitMex, deriBit} = require('../src/utils/exchangeApiKeyList');

const lib={
    binance:new Binance(binance),
    kucoin:new Kucoin(kuCoin),
    bybit:new Bybit(byBit),
    gateio:new Gateio(gateIo),
    okex:new Okex(okex),
    huobi:new HuoBi(huoBi),
    ftx:new Ftx(ftx),
    bitmex:new BitMex(bitMex),
    deribit:new Deribit(deriBit)
}
const  fullData = {};
const  KlineData = {};
let allOBExchangeNames = Object.keys(lib).filter(name => name != "bitmex" && name != "deribit")
let allExchangeNames = Object.keys(lib).filter(name => name != "ftx" && name != "huobi" && name!='bitmex' && name!='deribit');

function orderBook(exchange,symbol,cb){
    allOBExchangeNames.forEach(async exchangeName => {
        await lib[exchangeName].spot.socket.publicSocket.symbolOrderBook(symbol);
        lib[exchangeName].spot.socket.publicSocket.symbolOrderBookEE.on(`${exchangeName.toUpperCase()}_OB_UPDATES`,
            function (data) {
                fullData[exchangeName] = data
                cb(fullData)
            }
        );
    });
}


function getRealtimeKline(exchange,options,cb){
    allExchangeNames.forEach(async exchangeName => {
        await lib[exchangeName].spot.socket.publicSocket.symbolKline(options);
        lib[exchangeName].spot.socket.publicSocket.symbolKlineEE.on(`${exchangeName.toUpperCase()}_KL_UPDATE`,
            function (data) {
                KlineData[exchangeName] = data
                cb(KlineData)
            }
        );
    });
}
let obNum = 0, klNum = 0;
orderBook('', {fsym:"ETH", tsym: "USDT"}, function (data){
    console.log(`OB_UPDATE: ${obNum += 1}`)
})

getRealtimeKline('', {fsym:"ETH", tsym: "USDT", interval:"1m"}, function (data){
    console.log(`KL_UPDATE: ${klNum += 1}`)
})

















