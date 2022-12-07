const config = require('../config');
config.consoleLog = true;

const {HuoBi} = require('../exchange');
const {huoBi} = require('../src/utils/exchangeApiKeyList');

const huobiObj = new HuoBi(huoBi);

//******************************** SPOT ************************************************

//================================Account ====================================
// huobiObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//==============================Market Data ==============================
// huobiObj.spot.market.getValidSymbol('BTC','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// huobiObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })


// huobiObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// huobiObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// huobiObj.spot.market.getKlineHistory('ETH','USDT', '1m', {limit: 100}).then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })


//================================Order ====================================
// huobiObj.spot.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:5}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// huobiObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// huobiObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// huobiObj.spot.order.getOrders('ETH','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// huobiObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })


//================================Socket ====================================

// huobiObj.spot.socket.privateSocket.orderStateUpdate();
// huobiObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${huoBi.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${huoBi.name.toUpperCase()}_OR_UPDATE:${JSON.stringify(data)}`)
// })
//
// huobiObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// huobiObj.spot.socket.publicSocket.symbolOrderBookEE.on('HUOBI_OB_UPDATES', data=>{
//     console.log(`HUOBI_OB_UPDATES:${JSON.stringify(data)}`)
// })


//******************************** FUTURE ************************************************
//================================Account ====================================
// huobiObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })


//================================Market ====================================

// huobiObj.future.market.getValidSymbol('BTC', "USDT").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// huobiObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })


// huobiObj.future.market.getFundingRate('ETH', "USDT").then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// huobiObj.future.market.getOrderBook('BTC', "USDT").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// huobiObj.future.market.getKlineHistory('ETH', "USDT", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })



//================================Order ====================================
// huobiObj.future.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// huobiObj.future.order.getOrder('ETH', 'USDT', '12345').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// huobiObj.future.order.getOrders('ETH', 'USDT').then(data=>{
//     console.log('future.order.getOrders',data)
// })
//
// huobiObj.future.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// huobiObj.future.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('future.order.getOpenOrders',data)
// })


//================================Socket ====================================

// huobiObj.future.socket.privateSocket.orderStateUpdate();
// huobiObj.future.socket.privateSocket.orderStateUpdateEE.on(`${huoBi.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${huoBi.name.toUpperCase()}_FUTURE_OR_UPDATE:${JSON.stringify(data)}`)
// })

// huobiObj.future.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// huobiObj.future.socket.publicSocket.symbolKlineEE.on('HUOBI_FUTURE_KL_UPDATE', data=>{
//     console.log(`HUOBI_FUTURE_KL_UPDATE:${JSON.stringify(data)}`)
// })

// huobiObj.future.socket.publicSocket.symbolOrderBook({fsym:"BNB", tsym:"USDT"});
// huobiObj.future.socket.publicSocket.symbolOrderBookEE.on('HUOBI_FUTURE_OB_UPDATES', data=>{
//     console.log(`HUOBI_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })
