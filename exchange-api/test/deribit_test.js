const config = require('../config');
config.consoleLog = true;

const {Deribit} = require('../exchange');
const {deriBit} = require('../src/utils/exchangeApiKeyList');


const deribitObj = new Deribit(deriBit);

//******************************** FUTURE ************************************************
//================================Account ====================================
// deribitObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

//================================Order ====================================
// deribitObj.future.order.createOrder('ETH','PERPETUAL', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('future.order.createOrder',data)
// })
//
// deribitObj.future.order.cancelSingle('ETH','USDT','123455').then(data=>{
//     console.log('future.order.cancelSingle',data)
// })
//
// deribitObj.future.order.getOrder('ETH','USDT', '123455').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// deribitObj.future.order.getOrders('XRP','PERP').then(data=>{
//     console.log('future.order.getOrders',data)
// })

// deribitObj.future.order.getOpenOrders('XRP','PERP').then(data=>{
//     console.log('future.order.getOpenOrders',data)
// })


//==============================Market Data ==============================
// deribitObj.future.market.getValidSymbol('BTC', '30DEC22').then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// deribitObj.future.market.getAllSymbolInfo('BTC').then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// deribitObj.future.market.getOrderBook('BTC', 'PERPETUAL').then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// deribitObj.future.market.getFundingRate('BTC', 'PERPETUAL', {startTime:Date.now()-24*60*60, endTime:Date.now()}).then(data=>{
//     console.log('future.market.getFundingRate',data)
// })


//================================Socket ====================================

// deribitObj.future.socket.privateSocket.orderStateUpdate();
// deribitObj.future.socket.privateSocket.orderStateUpdateEE.on(`${deriBit.name.toUpperCase()}_FUTURE_OR_UPDATES`, data=>{
//     console.log(`${deriBit.name.toUpperCase()}_FUTURE_OR_UPDATES:${JSON.stringify(data)}`)
// })


// deribitObj.future.socket.publicSocket.symbolKline({fsym:"BTC", tsym:"PERPETUAL", interval: '1m'});
// deribitObj.future.socket.publicSocket.symbolKlineEE.on('DERIBIT_FUTURE_KL_UPDATES', data=>{
//     console.log(`DERIBIT_FUTURE_KL_UPDATES:${JSON.stringify(data)}`)
// })

// deribitObj.future.socket.publicSocket.symbolOrderBook({fsym:"BTC", tsym:"PERPETUAL"});
// deribitObj.future.socket.publicSocket.symbolOrderBookEE.on('DERIBIT_FUTURE_OB_UPDATES', data=>{
//     console.log(`DERIBIT_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })


