const config = require('../config');
config.consoleLog = true;

const {Binance}  = require('../exchange');
const {binance} = require('../src/utils/exchangeApiKeyList');

const binanceObj = new Binance(binance);

//******************************** SPOT ************************************************

//================================Account ====================================
// binanceObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//==============================Market Data ==============================
// binanceObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// binanceObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// binanceObj.spot.market.getMarketPrice('ETH', "USDT").then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })


// binanceObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// binanceObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// binanceObj.spot.market.getKlineHistory('ETH','USDT', '1m', {limit: 100}).then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })


//================================Order ====================================
// binanceObj.spot.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// binanceObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// binanceObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// binanceObj.spot.order.getOrders('ETH','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// binanceObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })


//================================Socket ====================================
// binanceObj.spot.socket.privateSocket.orderStateUpdate()
// binanceObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${binance.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${binance.name.toUpperCase()}_OR_UPDATE: ${JSON.stringify(data)}`)
// })
//
// binanceObj.spot.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// binanceObj.spot.socket.publicSocket.symbolKlineEE.on('BINANCE_KL_UPDATE', data=>{
//     console.log(`BINANCE_KL_UPDATE:${JSON.stringify(data)}`)
// })
//
// binanceObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// binanceObj.spot.socket.publicSocket.symbolOrderBookEE.on('BINANCE_OB_UPDATES', data=>{
//     console.log(`BINANCE_OB_UPDATES:${JSON.stringify(data)}`)
// })


//******************************** FUTURE ************************************************
//================================Account ====================================
// binanceObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

// binanceObj.future.account.getSymbolPositions('ETH', 'USDT').then(data=>{
//     console.log('future.account.getSymbolPositions',data)
// })

//================================Market ====================================

// binanceObj.future.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('future.market.get24hTickerStatistic',data)
// })

// binanceObj.future.market.getValidSymbol('BNB', "USDT").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// binanceObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// binanceObj.future.market.getMarketPrice('BLZ', "USDT").then(data=>{
//     console.log('future.market.getMarketPrice',data)
// })

// binanceObj.future.market.getFundingRate('BLZ', "USDT", {startTime:1642320000000, endTime: 1642550400000}).then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// binanceObj.future.market.getOrderBook('BTC', "USDT").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// binanceObj.future.market.getKlineHistory('BTC', "USDT", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })



//================================Order ====================================
// binanceObj.future.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// binanceObj.future.order.getOrder('ETH', 'USDT', '829947271).then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// binanceObj.future.order.getOrders('ETH', 'USDT').then(data=>{
//     console.log('future.order.getOrders',data)
// })
//
// binanceObj.future.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// binanceObj.future.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('future.order.getOpenOrders',data)
// })


//================================Socket ====================================
// binanceObj.future.socket.privateSocket.orderStateUpdate()
// binanceObj.future.socket.privateSocket.orderStateUpdateEE.on(`${binance.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${binance.name.toUpperCase()}_FUTURE_OR_UPDATE: ${JSON.stringify(data)}`);
// })
//
// binanceObj.future.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// binanceObj.future.socket.publicSocket.symbolKlineEE.on('BINANCE_FUTURE_KL_UPDATE', data=>{
//     console.log(`BINANCE_FUTURE_KL_UPDATE:${JSON.stringify(data)}`)
// })
//
// binanceObj.future.socket.publicSocket.symbolOrderBook({fsym:"BNB", tsym:"USDT"});
// binanceObj.future.socket.publicSocket.symbolOrderBookEE.on('BINANCE_FUTURE_OB_UPDATES', data=>{
//     console.log(`BINANCE_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })

// binanceObj.future.socket.publicSocket.markPriceUpdate({fsym:"BNB", tsym:"USDT"});
// binanceObj.future.socket.publicSocket.markPriceUpdateEE.on('BINANCE_FUTURE_MP_UPDATE', data=>{
//     console.log(`BINANCE_FUTURE_MP_UPDATE:${JSON.stringify(data)}`)
// })