const config = require('../config');
config.consoleLog = true;

const {BitMex} = require('../exchange');
const {bitMex} = require('../src/utils/exchangeApiKeyList');

const bitmexObj = new BitMex(bitMex);

//******************************** FUTURE ************************************************
//================================Account ====================================
// bitmexObj.future.account.getAccountBalance().then(data=>{
//     console.log('future.account.getAccountBalance',data)
// })

//================================Order ====================================
// bitmexObj.future.order.createOrder('BNB','USD', 'sell', 'limit', {quantity:2, price:390}).then(data=>{
//     console.log('future.order.createOrder',data)
// })
//319962ea-8e89-4e3b-a358-3550a75c8ace'
// bitmexObj.future.order.cancelSingle('BNB','USD','319962ea-8e89-4e3b-a358-3550a75c8ace').then(data=>{
//     console.log('future.order.cancelSingle',data)
// })
//
// bitmexObj.future.order.getOrder('BNB','USD', 'a0f7f8bc-0896-4c10-b637-06576fcb4779').then(data=>{
//     console.log('future.order.getOrder',data)
// })
//
// bitmexObj.future.order.getOrders('BNB','USD').then(data=>{
//     console.log('future.order.getOrders',data)
// })

//==============================Market Data ==============================
// bitmexObj.future.market.getValidSymbol('XRP', "H22").then(data=>{
//     console.log('future.market.getValidSymbol',data)
// })

// bitmexObj.future.market.getAllSymbolInfo().then(data=>{
//     console.log('future.market.getAllSymbolInfo',data)
// })

// bitmexObj.future.market.getOrderBook('ETH', "USDT").then(data=>{
//     console.log('future.market.getOrderBook',data)
// })

// bitmexObj.future.market.get24hTickerStatistic('BNB', "USDT").then(data=>{
//     console.log('future.market.get24hTickerStatistic',data)
// })



//================================Socket ====================================
// bitmexObj.future.socket.privateSocket.orderStateUpdate();
// bitmexObj.future.socket.privateSocket.orderStateUpdateEE.on(`${bitMex.name.toUpperCase()}_FUTURE_OR_UPDATE`, data=>{
//     console.log(`${bitMex.name.toUpperCase()}_FUTURE_OR_UPDATE:${JSON.stringify(data)}`)
// })

// bitmexObj.future.socket.publicSocket.symbolOrderBook({fsym:"BNB", tsym:"USDT"});
// bitmexObj.future.socket.publicSocket.symbolOrderBookEE.on('BITMEX_FUTURE_OB_UPDATES', data=>{
//     console.log(`BITMEX_FUTURE_OB_UPDATES:${JSON.stringify(data)}`)
// })
