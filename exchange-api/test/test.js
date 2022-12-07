const {HuoBi, Gateio, Kucoin} = require('../exchange');
const {huoBi, gateIo, kuCoin} = require('../src/utils/exchangeApiKeyList');

const huobiObj = new HuoBi(huoBi);
const gateioObj = new Gateio(gateIo);
const kucoinObj = new Kucoin(kuCoin);

let fsym = 'ETH';
let tsym = 'USDT';
let buysignal = 0.2;

let count  = 0;
let report = 1000
huobiObj.spot.socket.publicSocket.symbolKline({fsym: fsym, tsym: tsym, interval:"1m"});
huobiObj.spot.socket.publicSocket.symbolKlineEE.on('HUOBI_KL_UPDATE', data => {
    count++
    var spotPrice = data.kline.closePrice
    kucoinObj.future.market.getMarketPrice(fsym, tsym).then(data => {
        var futurePrice = data.data.price
        console.log("Kucoin " + spotPrice + ":" + futurePrice)
        var difpercent = ((futurePrice - spotPrice) / futurePrice) * 100
        console.log("Kucoin " + difpercent)
        if (difpercent >= buysignal) {
            console.log("Finally I got " + difpercent + "%" + " Spot@" + spotPrice + " &Future@" + futurePrice + " From Kucoin @" + new Date())
        }
    })

    gateioObj.future.market.getMarketPrice(fsym,  tsym).then(data => {
        var futurePrice = data.data.price
        console.log("GateIO " + spotPrice + ":" + futurePrice)
        var difpercent = ((futurePrice - spotPrice) / futurePrice) * 100
        console.log("GateIO " + difpercent)
        if (difpercent >= buysignal) {
            console.log("Finally I got " + difpercent + "%" + " Spot@" + spotPrice + " &Future@" + futurePrice + " From GateIO @" + new Date())
        }
    })

    if ((count % report) == 0) {
        console.log( "I ran " + count + " Times on HUOBI X GateIO @" + new Date())
    }
})