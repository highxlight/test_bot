const config = require('../config');
config.consoleLog = true;

const {Aax}  = require('../exchange');
const {aax} = require('../src/utils/exchangeApiKeyList');

const aaxObj = new Aax(aax);

//******************************** SPOT ************************************************

//================================Account ====================================
// aaxObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//================================Order ====================================
// aaxObj.spot.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// aaxObj.spot.order.cancelSingle('ETH','USDT', '1YTpWtVgtO').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })

// aaxObj.spot.order.getOrder('ETH','USDT', '1YTpWtVgtO').then(data=>{
//     console.log('spot.order.getOrder',data)
// })

// aaxObj.spot.order.getOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
//
// aaxObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })

//==============================Market Data ==============================
// aaxObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// aaxObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })
//
// aaxObj.spot.market.getKlineHistory('ETH', 'USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })

// aaxObj.spot.market.getOrderBook('ETH', 'USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

//================================Socket ====================================
// aaxObj.spot.socket.privateSocket.orderStateUpdate()
// aaxObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${aax.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(data)
// })
//
// aaxObj.spot.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// aaxObj.spot.socket.publicSocket.symbolKlineEE.on('AAX_KL_UPDATE', data=>{
//     console.log(`AAX_KL_UPDATE:${JSON.stringify(data)}`)
// })

// aaxObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// aaxObj.spot.socket.publicSocket.symbolOrderBookEE.on('AAX_OB_UPDATES', data=>{
//     console.log(`AAX_OB_UPDATES:${JSON.stringify(data)}`)
// })


//******************************** FUTURE ************************************************
//================================Account ====================================
// aaxObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

//================================Order ====================================
// aaxObj.future.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// aaxObj.future.order.getOrder('ETH', 'USDT', '829947271,').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// aaxObj.future.order.getOrders('ETH', 'USDT').then(data=>{
//     console.log('future.order.getOrders',data)
// })
//
// aaxObj.future.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// aaxObj.future.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })


//==============================Market Data ==============================
// aaxObj.future.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// aaxObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })
//
// aaxObj.future.market.getKlineHistory('ETH', 'USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })

// aaxObj.future.market.getOrderBook('ETH', 'USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })


// aaxObj.future.socket.privateSocket.orderStateUpdate()
// aaxObj.future.socket.privateSocket.orderStateUpdateEE.on(`${aax.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(data)
// })
//
// aaxObj.future.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// aaxObj.future.socket.publicSocket.symbolKlineEE.on('AAX_FUTURE_KL_UPDATE', data=>{
//     console.log(`AAX_FUTURE_KL_UPDATE:${JSON.stringify(data)}`)
// })

// aaxObj.future.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// aaxObj.future.socket.publicSocket.symbolOrderBookEE.on('AAX_FUTURE_OB_UPDATES', data=>{
//     console.log(`AAX_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })

// aaxObj.future.socket.publicSocket.markPriceUpdate({fsym:"BTC", tsym:"USDT"});
// aaxObj.future.socket.publicSocket.markPriceUpdateEE.on('AAX_FUTURE_MP_UPDATES', data=>{
//     console.log(`AAX_FUTURE_MP_UPDATES:${JSON.stringify(data)}`)
// })