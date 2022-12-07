const config = require('../config');
config.consoleLog = true;
config.envConfg.gateIo = true;

const {Gateio} = require('../exchange');
const {gateIo} = require('../src/utils/exchangeApiKeyList');

const gateioObj = new Gateio(gateIo);


//******************************** SPOT ************************************************

//================================Account ====================================
// gateioObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })

//==============================Market Data ==============================

// gateioObj.spot.market.getValidSymbol('BTC','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// gateioObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

//
// gateioObj.spot.market.getMarketPrice('BTC','USDT').then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })

// gateioObj.spot.market.get24hTickerStatistic('BTC','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// gateioObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// gateioObj.spot.market.getKlineHistory('ETH','USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })

//================================Order ====================================
// gateioObj.spot.order.createOrder('ETH','USDT', 'buy', 'limit', {quantity:1, price:2600}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// gateioObj.spot.order.cancelSingle('ETH','USDT', '123455').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// gateioObj.spot.order.getOrder('ETH','USDT', '123455').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// gateioObj.spot.order.getOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOrders',data)
// })

// gateioObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })

// gateioObj.spot.socket.privateSocket.orderStateUpdate();
// gateioObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${gateIo.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(`${gateIo.name.toUpperCase()}_OR_UPDATE:${JSON.stringify(data)}`)
// })

// gateioObj.spot.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// gateioObj.spot.socket.publicSocket.symbolKlineEE.on('GATEIO_KL_UPDATE', data=>{
//     console.log(`GATEIO_KL_UPDATE:${JSON.stringify(data)}`)
// })
//
// gateioObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// gateioObj.spot.socket.publicSocket.symbolOrderBookEE.on('GATEIO_OB_UPDATES', data=>{
//     console.log(`GATEIO_OB_UPDATES:${JSON.stringify(data)}`)
// })


//******************************** FUTURE ************************************************
//================================Account ====================================
// gateioObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

//================================Order ====================================
// gateioObj.future.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('future.order.createOrder',data)
// })
//
// gateioObj.future.order.cancelSingle('ETH','USDT','123455').then(data=>{
//     console.log('future.order.cancelSingle',data)
// })
//
// gateioObj.future.order.getOrder('ETH','USDT', '123455').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// gateioObj.future.order.getOrders('XRP','PERP').then(data=>{
//     console.log('future.order.getOrders',data)
// })

// gateioObj.future.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('future.order.getOpenOrders',data)
// })

//==============================Market Data ==============================
// gateioObj.future.market.getValidSymbol('BTC', "USDT").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// gateioObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// gateioObj.future.market.getMarketPrice('BTC', "USDT").then(data=>{
//     console.log('future.market.getMarketPrice',data)
// })

// gateioObj.future.market.getFundingRate('BTC', "USDT").then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// gateioObj.future.market.getOrderBook('BTC', "USDT", {limit: 50}).then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// gateioObj.future.market.getKlineHistory('BTC', "USDT", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })

// gateioObj.future.socket.privateSocket.orderStateUpdate();
// gateioObj.future.socket.privateSocket.orderStateUpdateEE.on(`${gateIo.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${gateIo.name.toUpperCase()}_FUTURE_OR_UPDATE:${JSON.stringify(data)}`)
// })


// gateioObj.future.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// gateioObj.future.socket.publicSocket.symbolKlineEE.on('GATEIO_FUTURE_KL_UPDATE', data=>{
//     console.log(`GATEIO_FUTURE_KL_UPDATE:${JSON.stringify(data)}`)
// })
//
// gateioObj.future.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// gateioObj.future.socket.publicSocket.symbolOrderBookEE.on('GATEIO_FUTURE_OB_UPDATES', data=>{
//     console.log(`GATEIO_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })