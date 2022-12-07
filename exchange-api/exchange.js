const {Binance} = require('./src/binance/binance');
const {BitMex} = require('./src/bitmex/bitmex');
const {Bybit} = require('./src/bybit/bybit');
const {Deribit} = require('./src/deribit/deribit');
const {Ftx} = require('./src/ftx/ftx');
const {Gateio} = require('./src/gateio/gateio');
const {HuoBi} = require('./src/huobi/huobi');
const {Kucoin} = require('./src/kucoin/kucoin');
const {Okex} = require('./src/okex/okex');
const {BitMart} = require('./src/bitmart/bitmart');
const {Aax} = require('./src/aax/aax');
const {CoinEx} = require('./src/coinex/coinex');
const {BitRue} = require('./src/bitrue/bitrue');
const {PoloNiex} = require('./src/poloniex/poloniex');
const {Digifinex} = require('./src/digifinex/digifinex');
const {Zerox} = require('./src/zerox/zerox');


module.exports = {
    Binance, BitMex, Bybit, Deribit, Ftx, Gateio, HuoBi, Kucoin, Okex, Zerox, BitMart, Aax, CoinEx, BitRue, PoloNiex, Digifinex
}