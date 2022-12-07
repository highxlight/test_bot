const config = require('../../../../config');
const { axios, logger } = require("../../../utils/utils");
const { ethers } = require("ethers");

class Account{


    #apiKey = '';
    #secretKey = '';
    #passphrase = '';
    #name = '';
    #netway='';

    //NONE OF THIS IS USED CURRENTLY FOR
    /**
     *
     * @param {string} apiKey The api key used in authentication
     * @param {string} name
     * @param {string} secretKey The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} passphrase The secret key to encrypt the data into HMAC SHA256 signature
     * @param {string} endpoint HTTP endpoint that will be passed into market and limit
     * @param {Number} timeout
     */

    constructor(name, apiKey, secretKey, passphrase, endpoint, timeout) {
        this.axiosInstance = axios.create({baseURL: endpoint, timeout: timeout});
        this.#apiKey = apiKey;
        this.#secretKey = secretKey;
        this.#passphrase = passphrase;
        this.#netway = config.zerox.netway;
    }


    /**
     * getAccountBalance
     * @returns {Promise<{data: null, success: boolean}>}
     */
    async getAccountBalance() {
        let response = {
            success:false,
            data:null
        };
        try {
            // 通过助记词创建钱包实例
            const wallet = ethers.Wallet.fromMnemonic(this.#passphrase);
            const connection = new ethers.providers.JsonRpcProvider(`https://eth-${this.#netway}.alchemyapi.io/v2/${this.#apiKey}`);
            let bal = await connection.getBalance(wallet.getAddress());
            let balance = ethers.utils.formatEther(bal);
            response.success = true;
            response.data = {
                balance: balance
            }
            return response;
        } catch (error) {
            logger.error(`binance.spot.account.getAccountBalance.error: ${error.message}`);
            response.success = false;
            response.data = {
                code: 400,
                msg: error.message
            }
            return response;
        }
    }

}
module.exports = {Account}