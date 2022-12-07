const config = require('../config');
config.consoleLog = true;

const {CoinEx}  = require('../exchange');
const {coinex} = require('../src/utils/exchangeApiKeyList');

const coinexObj = new CoinEx(coinex);


//******************************** SPOT ************************************************

//================================Account ====================================
// coinexObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//================================Order ====================================
// coinexObj.spot.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// coinexObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// coinexObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })

// coinexObj.spot.order.getOrders('ETH','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// coinexObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })

//==============================Market Data ==============================
// coinexObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })

// coinexObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// coinexObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// coinexObj.spot.market.getKlineHistory('ETH', 'USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })
//
// coinexObj.spot.market.getOrderBook('ETH', 'USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })


// coinexObj.spot.socket.privateSocket.orderStateUpdate()
// coinexObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${coinex.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${coinex.name.toUpperCase()}_OR_UPDATE: ${JSON.stringify(data)}`);
// })
//
//
// coinexObj.spot.socket.publicSocket.symbolOrderBook({fsym:"BTC", tsym:"USDT"});
// coinexObj.spot.socket.publicSocket.symbolOrderBookEE.on('COINEX_OB_UPDATES', data=>{
//     console.log(`COINEX_OB_UPDATES:${JSON.stringify(data)}`)
// })

//******************************** Future ************************************************

//================================Account ====================================
// coinexObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

//================================Order ====================================
// coinexObj.future.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// coinexObj.future.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('future.order.cancelSingle',data)
// })

// coinexObj.future.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// coinexObj.future.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('future.order.getOpenOrders',data)
// })

//==============================Market Data ==============================

// coinexObj.future.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// coinexObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// coinexObj.future.market.getKlineHistory('ETH', 'USDT', '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })
//
// coinexObj.future.market.getOrderBook('ETH', 'USDT').then(data=>{
//     console.log('future.market.getOrderBook',data)
// })
// coinexObj.future.market.getFundingRate('ETH', 'USDT').then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// coinexObj.future.socket.privateSocket.orderStateUpdate()
// coinexObj.future.socket.privateSocket.orderStateUpdateEE.on(`${coinex.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${coinex.name.toUpperCase()}_FUTURE_OR_UPDATE: ${JSON.stringify(data)}`);
// })
// coinexObj.future.socket.publicSocket.symbolOrderBook({fsym:"BTC", tsym:"USDT"});
// coinexObj.future.socket.publicSocket.symbolOrderBookEE.on('COINEX_FUTURE_OB_UPDATES', data=>{
//     console.log(`COINEX_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })
