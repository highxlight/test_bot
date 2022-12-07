const config = require('../config');
config.consoleLog = true;
config.zerox.netway = 'ropsten';  // // mainnet, binance, ropsten, polygon, avalanche, fantom, celo,optimism

const {Zerox}  = require('../exchange');
const {zerox} = require('../src/utils/exchangeApiKeyList');

const zeroxObj = new Zerox(zerox);



//******************************** SPOT ************************************************

//==============================Account ==============================
//
// zeroxObj.spot.account.getAccountBalance().then(data=>{
//     console.log('spot.market.getAccountBalance',data)
// })

//==============================Market Data ==============================

// zeroxObj.spot.market.getValidSymbol('WETH').then(data=>{
//     console.log('spot.market.getValidSymbol',data)
// })


// zeroxObj.spot.market.getAllSymbolInfo().then(data=>{
//     console.log('spot.market.getAllSymbolInfo',data)
// })
//
// zeroxObj.spot.market.getMarketPrice('WETH', 'DAI').then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })
//
// zeroxObj.spot.market.getOrderBook('WETH', 'DAI').then(data=>{
//     console.log('spot.market.getMarketPrice',data)
// })


//
// //'WETH', 'DAI'
// zeroxObj.spot.market.getOrderBook('0x4e15361fd6b4bb609fa63c81a2be19d873717870', '0x6b175474e89094c44da98b954eedeac495271d0f').then(data=>{
//     console.log('spot.market.getOrderBook',data)
// })

//================================Order ====================================
// ETH   0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
// DAI   0xad6d458402f60fd3bd25163575031acdce07538d
// WETH   0xc778417e063141139fce010982780140aa0cd5ab
// zeroxObj.spot.order.createOrder('WETH','DAI', 'sell', 'market', {amount: 100000000000}).then(data=>{
//     console.log('spot.order.createOrder',data)
// })
// console.log(Number(0x6760765800))
// const Decimal = require('decimal.js');
// let num = new Decimal('0.000000000292258957').sub(new Decimal('0.00000000029225161')).toNumber();
// // sellAmount = 15
// ETH   1.2871082173500592         1.2005131213500592              0.086595096     1000000000000000000
// WETH   2.999999999999399925      2.99999999999939991             1.5e-17         0.000000000000000015
// DAI   0.00000000029225161        0.000000000292258957            7.347e-15       0.000000000000007347
// Transaction Fee:  0.086595096
// Gas Price: 0.000000444
// {
//     success: true,
//         data: {
//     to: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
//         from: '0x3498A8d2Ea773b1B27401153DCb71343CbD2Ee5c',
//         contractAddress: null,
//         transactionIndex: 6,
//         gasUsed: BigNumber { _hex: '0x02f9da', _isBigNumber: true }, //195034
//     logsBloom: '0x002040000000000000000010800000000000000040000100000000000010000000010400000100100000000000000000000000000000000000000000000000000400000000000008000200080040002000000000000000000000000000000000000000000000000000
//     000010000000000000000000000000000000100000000000000000000000000100020000000000000000000000000800000040000000000080000000000000000000001000010000000000000000000000000000000040210000020010000000000000000000000000000000000010000040
//     00010000000000000000000400020000000000000400002000000000000800000010001400',
//     blockHash: '0x2afc779f0a0768cd0f4e0cbd951dfe722ab0716c9792195bec0af45a40444a6c',
//         transactionHash: '0x5fc2cf580f443347278583a8a07480db09b3e21e5d65a1143851e5eaadea36c0',
//         logs: [
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object]
//     ],
//         blockNumber: 12253247,
//         confirmations: 1,
//         cumulativeGasUsed: BigNumber { _hex: '0x073d82', _isBigNumber: true }, //474498
//     effectiveGasPrice: BigNumber { _hex: '0x6760765800', _isBigNumber: true }, // 444000000000
//     status: 1,
//         type: 2,
//         byzantium: true
// }
// const Decimal = require('decimal.js');
// let num = new Decimal('0.00004898190230494').sub(new Decimal('0.000000000292258957')).toNumber();
// console.log(num)

// sellAmount = 100000000000
// ETH   1.2005131213500592                 1.1841182315197526              0.0163948898303066
// WETH  2.99999999999939991                2.99999989999939991             1e-7
// DAI   0.000000000292258957               0.00004898190230494             0.000048981610045983
// Transaction Fee:  0.013861898
// Gas Price: 0.000000071
// {
//     success: true,
//         data: {
//     to: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
//         from: '0x3498A8d2Ea773b1B27401153DCb71343CbD2Ee5c',
//         contractAddress: null,
//         transactionIndex: 1,
//         gasUsed: BigNumber { _hex: '0x02faa6', _isBigNumber: true },  //195238
//     logsBloom: '0x002040000000000000000010800000000000000040000100000000000010000000010400000100100000000000000000000000000000000000000000000000000400000000000008000200080040002000000000000000000000000000000000000000000000000000
//     000010000000000000000000000000000000100000000000000000000000000100020000000000000000000000000800000040000000000080000000000000000000001000010000000000000000000000000000000040210000020010000000000000000000000000000000000010000040
//     00010000000000000000000400020000000000000400002000000000000800000010001400',
//     blockHash: '0x0e88e151d151ae050386bf8af61f9ce0d4016b0d5c6371ae7c0d8bd28c64163b',
//         transactionHash: '0x6307ec9d3e04385f409f3ae469ffb3a5cb39b61d5a0578a788cf9a910fd0c911',
//         logs: [
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object]
//     ],
//         blockNumber: 12254554,
//         confirmations: 1,
//         cumulativeGasUsed: BigNumber { _hex: '0x034cae', _isBigNumber: true }, //216238
//     effectiveGasPrice: BigNumber { _hex: '0x1087ee0600', _isBigNumber: true }, //71000000000
//     status: 1,
//         type: 2,
//         byzantium: true
// }
// }
