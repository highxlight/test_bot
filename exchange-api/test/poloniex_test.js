const config = require('../config');
config.consoleLog = true;
const  {timeFormat} = require('../src/utils/utils')
const {PoloNiex}  = require('../exchange');
const {poloniex} = require('../src/utils/exchangeApiKeyList');

const poloniexObj = new PoloNiex(poloniex);

//******************************** SPOT ************************************************

//================================Account ====================================
// poloniexObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//==============================Market Data ==============================
// poloniexObj.spot.market.getValidSymbol('BTC','BTS').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// poloniexObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// poloniexObj.spot.market.getOrderBook('BTC','ETH').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// poloniexObj.spot.market.getKlineHistory('BTC','ETH', '5m', {limit: 100}).then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })


//================================Order ====================================
// poloniexObj.spot.order.createOrder('BTC','ETH', 'sell', 'limit', {quantity:1, price: 34000}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// poloniexObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })

// poloniexObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })

// poloniexObj.spot.order.getOrders('BTC','ETH').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// poloniexObj.spot.order.getOpenOrders('BTC','ETH').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })

//================================Socket ====================================
// poloniexObj.spot.socket.privateSocket.orderStateUpdate()
// poloniexObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${poloniex.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${poloniex.name.toUpperCase()}_OR_UPDATE: ${JSON.stringify(data)}`)
// })

// poloniexObj.spot.socket.publicSocket.symbolOrderBook({fsym:"BTC", tsym:"BTS"});
// poloniexObj.spot.socket.publicSocket.symbolOrderBookEE.on('POLONIEX_OB_UPDATES', data=>{
//     console.log(`POLONIEX_OB_UPDATES:${JSON.stringify(data)}`)
// })


//******************************** FUTURE ************************************************
//================================Account ====================================
// poloniexObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })


//================================Market ====================================

// poloniexObj.future.market.getValidSymbol('BTC', "USDTPERP").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// poloniexObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// poloniexObj.future.market.getMarketPrice('ETH', "USDTPERP").then(data=>{
//     console.log('future.market.getMarketPrice',data)
// })

// poloniexObj.future.market.getFundingRate('ETH', "USDTPERP").then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// poloniexObj.future.market.getOrderBook('BTC', "USDTPERP").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// poloniexObj.future.market.getKlineHistory('ETH', "USDTPERP", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })



//================================Order ====================================
// poloniexObj.future.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// poloniexObj.future.order.getOrder('ETH', 'USDT', '12345').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// poloniexObj.future.order.getOrders('ETH', 'USDT').then(data=>{
//     console.log('future.order.getOrders',data)
// })
//
// poloniexObj.future.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// poloniexObj.future.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('future.order.getOpenOrders',data)
// })


//================================Socket ====================================

// poloniexObj.future.socket.privateSocket.orderStateUpdate();
// poloniexObj.future.socket.privateSocket.orderStateUpdateEE.on(`${poloniex.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${poloniex.name.toUpperCase()}_FUTURE_OR_UPDATE:${JSON.stringify(data)}`)
// })


// poloniexObj.future.socket.publicSocket.symbolOrderBook({fsym:"BNB", tsym:"USDTPERP"});
// poloniexObj.future.socket.publicSocket.symbolOrderBookEE.on('POLONIEX_FUTURE_OB_UPDATES', data=>{
//     console.log(`POLONIEX_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })

