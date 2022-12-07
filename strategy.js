const path = require("path");
module.exports = {
  aitrade: {
    symbol: {
      fsym: "BTC",
      tsym: "USDT",
    },
    initialAssets: {
      BTC: 0,
      USDT: 513.0565082,
    },
    recordPath: path.join(__dirname, "../../db/tx.json"),
    email: {
      subscribed: ["jasonyuan@tuofaninfo.com", "maxchua@tuofaninfo.com"],
      account: "no-reply@xerosum.io",
    },
    orderAmount: 0.002,
    maintainRatio: 0.01,
    gainRatio: 0.001,
    openTimeout: 1000 * 59,
    trend: 5,
    model: {
      path: "./vendor/ml-model-storage/model/BTCUSDT_1m_NEXT_PRICE7_6005_99.799_42.88876033902666_0.0012_1657226525703_spot",
    },
  },
};
