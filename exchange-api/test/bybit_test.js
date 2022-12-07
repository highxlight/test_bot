const config = require('../config');
config.consoleLog = true;

const {Bybit} = require('../exchange');
const {byBit} = require('../src/utils/exchangeApiKeyList');

const bybitObj = new Bybit(byBit);

//******************************** SPOT ************************************************

//================================Account ====================================
// bybitObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//==============================Market Data ==============================
// bybitObj.spot.market.getValidSymbol('BTC','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// bybitObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// bybitObj.spot.market.getMarketPrice('BTC', "USDT").then(data=>{
//     console.log('future.account.getMarketPrice',data)
// })


// bybitObj.spot.market.get24hTickerStatistic('BTC','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })

// bybitObj.spot.market.getOrderBook('BTC','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// bybitObj.spot.market.getKlineHistory('ETH','USDT', '1m', {limit: 100}).then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })


//================================Order ====================================
// bybitObj.spot.order.createOrder('BTC','USDT', 'buy', 'market', {quantity:0.01}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// bybitObj.spot.order.cancelSingle('ETH','USDT', '1096994260120631040').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// bybitObj.spot.order.getOrder('BTC','USDT', '1096994260120631040').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// bybitObj.spot.order.getOrders('BTC','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// bybitObj.spot.order.getOpenOrders('BTC','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })


//================================Socket ====================================

// bybitObj.spot.socket.privateSocket.orderStateUpdate();
// bybitObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${byBit.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${byBit.name.toUpperCase()}_OR_UPDATE:${JSON.stringify(data)}`)
// })

// bybitObj.spot.socket.publicSocket.symbolKline({fsym:"BTC", tsym:"USDT", interval:"1m"});
// bybitObj.spot.socket.publicSocket.symbolKlineEE.on('BYBIT_KL_UPDATE', data=>{
//     console.log(`BYBIT_KL_UPDATE:${JSON.stringify(data)}`)
// })
// //
// bybitObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// bybitObj.spot.socket.publicSocket.symbolOrderBookEE.on('BYBIT_OB_UPDATES', data=>{
//     console.log(`BYBIT_OB_UPDATES:${JSON.stringify(data)}`)
// })


//******************************** FUTURE ************************************************
//================================Account ====================================
// bybitObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })


//================================Market ====================================

// bybitObj.future.market.getValidSymbol('BTC', "USDT").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })
// bybitObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// bybitObj.future.market.getOrderBook('BTC', "USDT").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// bybitObj.future.market.getKlineHistory('BTC', "USDT", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })



//================================Order ====================================
// bybitObj.future.order.createOrder('BTC','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// bybitObj.future.order.getOrder('ETH', 'USDT', '12345').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// bybitObj.future.order.getOrders('ETH', 'USDT').then(data=>{
//     console.log('future.order.getOrders',data)
// })
//
// bybitObj.future.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//


//================================Socket ====================================

// bybitObj.future.socket.privateSocket.orderStateUpdate();
// bybitObj.future.socket.privateSocket.orderStateUpdateEE.on(`${byBit.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//    console.log(`${byBit.name.toUpperCase()}_FUTURE_OR_UPDATE:${JSON.stringify(data)}`)
// })

// bybitObj.future.socket.publicSocket.symbolKline({fsym:"BTC", tsym:"USDT", interval:"1m"});
// bybitObj.future.socket.publicSocket.symbolKlineEE.on('BYBIT_FUTURE_KL_UPDATE', data=>{
//    console.log(`BYBIT_FUTURE_KL_UPDATE:${JSON.stringify(data)}`)
// })

// bybitObj.future.socket.publicSocket.symbolOrderBook({fsym:"BTC", tsym:"USDT"});
// bybitObj.future.socket.publicSocket.symbolOrderBookEE.on('BYBIT_FUTURE_OB_UPDATES', data=>{
//     console.log(`BYBIT_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })
