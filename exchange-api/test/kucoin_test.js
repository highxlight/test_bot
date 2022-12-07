const {Kucoin} = require('../exchange');
const {kuCoin} = require('../src/utils/exchangeApiKeyList');

const kucoinObj = new Kucoin(kuCoin);

//******************************** SPOT ************************************************

//================================Account ====================================
// kucoinObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })

//==============================Market Data ==============================

// kucoinObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// kucoinObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// kucoinObj.spot.market.getMarketPrice('ETH','USDT').then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })

// kucoinObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// kucoinObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// kucoinObj.spot.market.getKlineHistory('ETH','USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })

//================================Order ====================================
// kucoinObj.spot.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// kucoinObj.spot.order.cancelSingle('ETH','USDT', {orderId: '123455'}).then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// kucoinObj.spot.order.getOrder('ETH','USDT', {orderId: '5c35c02703aa673ceec2a168'}).then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// kucoinObj.spot.order.getOrders('ETH','USDT', {}).then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//

//================================Socket ====================================
// kucoinObj.spot.socket.privateSocket.orderStateUpdate()
// kucoinObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${kuCoin.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(data)
// })
// kucoinObj.spot.socket.publicSocket.symbolOrderBook({fsym:"BTC", tsym:"USDT"});
// kucoinObj.spot.socket.publicSocket.symbolOrderBookEE.on('KUCOIN_OB_UPDATES', data=>{
//     console.log(`KUCOIN_OB_UPDATES:${JSON.stringify(data)}`)
// })
// kucoinObj.spot.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// kucoinObj.spot.socket.publicSocket.symbolKlineEE.on('KUCOIN_KL_UPDATE', data=>{
//     console.log(`KUCOIN_KL_UPDATE:${JSON.stringify(data)}`)
// })



//******************************** FUTURE ************************************************
//================================Account ====================================
// kucoinObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })
// kucoinObj.future.account.getSymbolPositions('ETH', 'USDT').then(data=>{
//     console.log('future.account.getSymbolPositions',data)
// })

//================================Order ====================================
// kucoinObj.future.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('future.order.createOrder',data)
// })
//
// kucoinObj.future.order.cancelSingle('ETH','USDT', '123455').then(data=>{
//     console.log('future.order.cancelSingle',data)
// })
//
// kucoinObj.future.order.getOrder('ETH','USDT', '5c35c02703aa673ceec2a168').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// kucoinObj.future.order.getOrders('ETH','USDT', {}).then(data=>{
//     console.log('future.order.getOrders',data)
// })

//==============================Market Data ==============================
// kucoinObj.future.market.getValidSymbol('XBT', "USDT").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// kucoinObj.future.market.getMarketPrice('BTC', "USDT").then(data=>{
//     console.log('future.market.getMarketPrice',data)
// })

// kucoinObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// kucoinObj.future.market.getFundingRate('ETH', "USDT").then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// kucoinObj.future.market.getOrderBook('BTC', "USDT").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// kucoinObj.future.market.getKlineHistory('BTC', "USDT", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })



//================================Socket ====================================
// kucoinObj.future.socket.privateSocket.orderStateUpdate()
// kucoinObj.future.socket.privateSocket.orderStateUpdateEE.on(`${kuCoin.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${kuCoin.name.toUpperCase()}_FUTURE_OR_UPDATE: ${JSON.stringify(data)}`);
// })


// kucoinObj.future.socket.publicSocket.symbolOrderBook({fsym:"XBT", tsym:"USDT"});
// kucoinObj.future.socket.publicSocket.symbolOrderBookEE.on('KUCOIN_FUTURE_OB_UPDATES', data=>{
//     console.log(`KUCOIN_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })
