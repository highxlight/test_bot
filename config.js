require('dotenv').config();
const path = require('path');
const config = {
    apimode: process.env.API_MODE ?? 'dev',
    port: process.env.PORT ?? 3000,
    db: {
        sql: {},
        mongo: process.env.MONGO_URL ?? 'mongodb://localhost:27017/test_bot',
    },
    bot: {
        symbol: {
            exchange: 'binance',
            marketType: 'spot',
            fsym: 'BTC',
            tsym: 'USDT',
            name: 'binance73',
            userId: '631896e2d09b709d24150a16',
        },
        initialAssets: {
            BTC: 0,
            USDT: 513.0565082,
        },
        recordPath: path.join(__dirname, '../../db/tx.json'),
        email: {
            subscribed: ['jasonyuan@tuofaninfo.com', 'maxchua@tuofaninfo.com'],
            account: 'no-reply@xerosum.io',
        },
        orderAmount: 0.002,
        maintainRatio: 0.01,
        gainRatio: -5,
        openTimeout: 1000 * 59,
        trend: 5,
        model: {
            path: './vendor/ml-model-storage/model/BTCUSDT_1m_NEXT_PRICE7_6005_99.799_42.88876033902666_0.0012_1657226525703_spot',
        },
    },
    exchange: {
        name: 'bot9',
        exchange: 'Binance',
        apiKey: 'viXA5UU3b1gxMuloZkWSmN5d5Klc2ci7cpaHywz6VM1P8XHABYOmunWCVswSduQ4',
        secretKey: '0ulbXWCvuqtRKtx8S3KsLrmYWGSqqZFkTRW2PaHYwQbyjzpbI9FX9o93niVTEWSo',
        futureApiKey: 'viXA5UU3b1gxMuloZkWSmN5d5Klc2ci7cpaHywz6VM1P8XHABYOmunWCVswSduQ4',
        futureSecretKey: '0ulbXWCvuqtRKtx8S3KsLrmYWGSqqZFkTRW2PaHYwQbyjzpbI9FX9o93niVTEWSo',
    },
};

module.exports = config;
