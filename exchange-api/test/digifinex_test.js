const config = require('../config');
config.consoleLog = true;

const {Digifinex}  = require('../exchange');
const {digiginex} = require('../src/utils/exchangeApiKeyList');

const digifinexObj = new Digifinex(digiginex);

//******************************** SPOT ************************************************

//================================Account ====================================
// digifinexObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.account.getAccountBalance',data)
// })


//==============================Market Data ==============================
// digifinexObj.spot.market.getValidSymbol('ETH','USDT').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })

// digifinexObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })

// digifinexObj.spot.market.get24hTickerStatistic('ETH','USDT').then(data=>{
//     console.log('spot.market.get24hTickerStatistic',data)
// })
//
// digifinexObj.spot.market.getOrderBook('ETH','USDT').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

// digifinexObj.spot.market.getKlineHistory('ETH','USDT', '1m').then(data=>{
//     console.log('spot.market.getKlineHistory',data)
// })


//================================Order ====================================
// digifinexObj.spot.order.createOrder('ETH','BTC', 'sell', 'limit', {quantity:1, price: 34000}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
//
// digifinexObj.spot.order.cancelSingle('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.cancelSingle',data)
// })
//
// digifinexObj.spot.order.getOrder('ETH','USDT', '12345').then(data=>{
//     console.log('spot.order.getOrder',data)
// })

// digifinexObj.spot.order.getOrders('ETH','USDT', '').then(data=>{
//     console.log('spot.order.getOrders',data)
// })


//================================Socket ====================================
// digifinexObj.spot.socket.privateSocket.orderStateUpdate()
// digifinexObj.spot.socket.privateSocket.orderStateUpdateEE.on(`DIGIFINEX_OR_UPDATE`, data=>{
//     console.log(`DIGIFINEX_OR_UPDATE_OR_UPDATE: ${JSON.stringify(data)}`)
// })


// digifinexObj.spot.socket.publicSocket.symbolOrderBook({fsym:"ETH", tsym:"USDT"});
// digifinexObj.spot.socket.publicSocket.symbolOrderBookEE.on('DIGIFINEX_OB_UPDATES', data=>{
//     console.log(`DIGIFINEX_OB_UPDATES:${JSON.stringify(data)}`)
// })
