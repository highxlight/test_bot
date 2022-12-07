const config = require('../config');
const moment = require('moment');
config.consoleLog = true;

const {Ftx} = require('../exchange');
const {ftx} = require('../src/utils/exchangeApiKeyList');

const ftxObj = new Ftx(ftx);


//******************************** SPOT ************************************************

//================================Account ====================================
// ftxObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })

//==============================Market Data ==============================

// ftxObj.spot.market.getValidSymbol('BNB','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// ftxObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

//
// ftxObj.spot.market.getMarketPrice('BNB','USDT').then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })

// ftxObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// ftxObj.spot.market.getKlineHistory('ETH','USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })

//================================Order ====================================
// ftxObj.spot.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// ftxObj.spot.order.cancelSingle('ETH','USDT', '123455').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// ftxObj.spot.order.getOrder('ETH','USDT', '123455').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// ftxObj.spot.order.getOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOrders',data)
// })


//================================Socket ====================================
// ftxObj.spot.socket.privateSocket.orderStateUpdate()
// ftxObj.spot.socket.privateSocket.orderStateUpdateEE.on('FTX_OR_UPDATE', data=>{
//     console.log(data)
// })
// ftxObj.spot.socket.publicSocket.symbolOrderBook({fsym:"BNB", tsym:"USDT"});
// ftxObj.spot.socket.publicSocket.symbolOrderBookEE.on('FTX_OB_UPDATES', data=>{
//     console.log(`FTX_OB_UPDATES:${JSON.stringify(data)}`)
// })



//******************************** FUTURE ************************************************
//================================Account ====================================
// ftxObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

// ftxObj.future.account.getSymbolPositions('ETH', 'USDT').then(data=>{
//     console.log('future.account.getSymbolPositions',data)
// })

//================================Order ====================================
// ftxObj.future.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('future.order.createOrder',data)
// })
//
// ftxObj.future.order.cancelSingle('ETH','USDT','123455').then(data=>{
//     console.log('future.order.cancelSingle',data)
// })
//
// ftxObj.future.order.getOrder('ETH','USDT', '123455').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// ftxObj.future.order.getOrders('XRP','PERP').then(data=>{
//     console.log('future.order.getOrders',data)
// })

//==============================Market Data ==============================
// ftxObj.future.market.getValidSymbol('XRP', "PERP").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// ftxObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// ftxObj.future.market.getMarketPrice('XRP', "PERP").then(data=>{
//     console.log('future.market.getMarketPrice',data)
// })

// ftxObj.future.market.getFundingRate('XRP', "PERP").then(data=>{
//     console.log('future.market.getFundingRate',data)
// })

// ftxObj.future.market.getOrderBook('XRP', "PERP").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// ftxObj.future.market.getKlineHistory('XRP', "PERP", '1m').then(data=>{
//     console.log('future.market.getKlineHistory',data)
// })



//================================Socket ====================================
// ftxObj.future.socket.privateSocket.orderStateUpdate()
// ftxObj.future.socket.privateSocket.orderStateUpdateEE.on('KUCOINE_FUTURE_OR_UPDATE', data=>{
//     console.log(`KUCOIN_FUTURE_OR_UPDATE: ${JSON.stringify(data)}`);
// })
//
//
// ftxObj.future.socket.publicSocket.symbolOrderBook({fsym:"XBT", tsym:"PERP"});
// ftxObj.future.socket.publicSocket.symbolOrderBookEE.on('FTX_FUTURE_OB_UPDATES', data=>{
//     console.log(`FTX_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })
