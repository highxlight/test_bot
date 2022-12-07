const config = require('../config');
config.consoleLog = true;


const {Okex} = require('../exchange');
const {okex} = require('../src/utils/exchangeApiKeyList');

const okexObj = new Okex(okex);

//******************************** SPOT ************************************************

//================================Account ====================================
// okexObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//==============================Market Data ==============================
// okexObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// okexObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// okexObj.spot.market.getMarketPrice('ETH','USDT').then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })

// okexObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// okexObj.spot.market.getOrderBook('BTC','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// okexObj.spot.market.getKlineHistory('ETH','USDT', '1m', {limit: 100}).then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })


//================================Order ====================================
// okexObj.spot.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// okexObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// okexObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// okexObj.spot.order.getOrders('ETH','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// okexObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })


//================================Socket ====================================

// okexObj.spot.socket.privateSocket.orderStateUpdate();
// okexObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${okex.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${okex.name.toUpperCase()}_OR_UPDATE:${JSON.stringify(data)}`)
// })



// okexObj.spot.socket.publicSocket.symbolKline({fsym:"BTC", tsym:"USDT", interval:"1m"});
// okexObj.spot.socket.publicSocket.symbolKlineEE.on('OKEX_KL_UPDATE', data=>{
//     console.log(`OKEX_KL_UPDATE:${JSON.stringify(data)}`)
// })
//
// okexObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// okexObj.spot.socket.publicSocket.symbolOrderBookEE.on('OKEX_OB_UPDATES', data=>{
//     console.log(`OKEX_OB_UPDATES:${JSON.stringify(data)}`)
// })
