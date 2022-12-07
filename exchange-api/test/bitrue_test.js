const config = require('../config');
config.consoleLog = true;

const {BitRue}  = require('../exchange');
const {bitrue} = require('../src/utils/exchangeApiKeyList');

const bitRueObj = new BitRue(bitrue);

//******************************** SPOT ************************************************

//================================Account ====================================
// bitRueObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })

//================================Order ====================================
// bitRueObj.spot.order.createOrder('ETH','USDT', 'buy', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// bitRueObj.spot.order.cancelSingle('ETH','USDT', '123455').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// bitRueObj.spot.order.getOrder('ETH','USDT', '123455').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// bitRueObj.spot.order.getOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOrders',data)
// })
// bitRueObj.spot.order.getOpenOrders('ETH','USDT').then(data=>{
//     console.log('spot.order.getOpenOrders',data)
// })

//==============================Market Data ==============================
// bitRueObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// bitRueObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// bitRueObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// bitRueObj.spot.market.getMarketPrice('ETH', "USDT").then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })

// bitRueObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })


//================================Socket ====================================
// bitRueObj.spot.socket.privateSocket.orderStateUpdate()
// bitRueObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${bitrue.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(data)
// })