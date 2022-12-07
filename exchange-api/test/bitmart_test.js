const config = require('../config');
config.consoleLog = true;

const {BitMart}  = require('../exchange');
const {bitmart} = require('../src/utils/exchangeApiKeyList');

const bitmartObj = new BitMart(bitmart);

//******************************** SPOT ************************************************

//================================Account ====================================
// bitmartObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//================================Order ====================================
// bitmartObj.spot.order.createOrder('ETH','USDT', 'sell', 'market', {quantity:1}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })

// bitmartObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// bitmartObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })
//
// bitmartObj.spot.order.getOrders('ETH','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })


//==============================Market Data ==============================
// bitmartObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })

// bitmartObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// bitmartObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// bitmartObj.spot.market.getKlineHistory('ETH', 'USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })

// bitmartObj.spot.market.getOrderBook('ETH', 'USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })


//================================Socket ====================================
// bitmartObj.spot.socket.privateSocket.orderStateUpdate()
// bitmartObj.spot.socket.privateSocket.orderStateUpdateEE.on(`${bitmart.name.toUpperCase()}_OR_UPDATE`, data=>{
//     console.log(data)
// })
//
// bitmartObj.spot.socket.publicSocket.symbolKline({fsym:"ETH", tsym:"USDT", interval:"1m"});
// bitmartObj.spot.socket.publicSocket.symbolKlineEE.on('BITMART_KL_UPDATE', data=>{
//     console.log(`BITMART_KL_UPDATE:${JSON.stringify(data)}`)
// })
//
// bitmartObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// bitmartObj.spot.socket.publicSocket.symbolOrderBookEE.on('BITMART_OB_UPDATES', data=>{
//     console.log(`BITMART_OB_UPDATES:${JSON.stringify(data)}`)
// })