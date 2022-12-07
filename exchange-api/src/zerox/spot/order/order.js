const { createSignature, ExchangeInfo } = require("../../../utils/utils");
const config = require('../../../../config');
const { axios, logger } = require("../../../utils/utils");
const { ethers } = require("ethers");
const erc20ABI = require('./erc20_abi.json');

class Order {

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



    async createOrder(fsym, tsym, side, type, options) {
        const endpoint ='/swap/v1/quote';
        let queryString = `sellToken=${fsym}&buyToken=${tsym}`;
        let response = {
            success: false,
            data: null
        };
        //3. amount can be either buyAmount (side is buy) or sellAmount (side is sell)
        if (side.toLowerCase() == 'sell') {
            queryString += `&sellAmount=${options.amount}`;
        }else if (side.toLowerCase() == 'buy') {
            queryString += `&buyAmount=${options.amount}`;
        }
        let txInfo = await this.constructObjToSend(`${endpoint}?${queryString}`);
        if(txInfo === null){
            return  response;
        }else {
            fsym = txInfo.sellTokenAddress;
            tsym = txInfo.buyTokenAddress;
            delete txInfo.buyTokenAddress;
            delete txInfo.sellTokenAddress;
        }
        // 通过助记词创建钱包实例
        const wallet = ethers.Wallet.fromMnemonic(this.#passphrase);
        // 0x3498A8d2Ea773b1B27401153DCb71343CbD2Ee5c
        //
        const connection = new ethers.providers.JsonRpcProvider(`https://eth-${this.#netway}.alchemyapi.io/v2/${this.#apiKey}`);
        const signer = wallet.connect(connection);
        const sellTokenContract = new ethers.Contract(fsym, erc20ABI, signer);
        const buyTokenContract = new ethers.Contract(tsym, erc20ABI, signer);
        const address2 = await wallet.getAddress();
        let tokenContract =  null;
        if (side.toLowerCase() == 'sell') {
            tokenContract = sellTokenContract;
        }else if (side.toLowerCase() == 'buy') {
            tokenContract = buyTokenContract
        }
        const currentAllowance = await tokenContract.allowance(address2, this.#secretKey);
        if (currentAllowance.lt(ethers.BigNumber.from(parseFloat(options.amount)))) {
            console.log("Set Approve");
            //approve to 0x contract, different chain will be different address, https://docs.0x.org/developer-resources/contract-addresses
            await (await tokenContract.approve(this.#secretKey, parseFloat(options.amount) * 500)).wait();
        }
        try {
            txInfo.from = address2;
            // 发起交易请求
            let submitedTx = await signer.sendTransaction(txInfo);
            // 等待
            let minedTx = await submitedTx.wait();
            logger.debug(`Transaction info:${JSON.stringify(minedTx, null, "\t")}`);
            if (minedTx.status === 1) {
               response.success = true;
               response.data = minedTx;
            } else {
                response.success = false;
                response.data = {
                    code: 400,
                    msg: 'Order fail, reverted'
                }
            }
            return  response
        } catch (error) {
            logger.error(`zerox.spot.order.createOrder.error: ${error.message}`);
            response.success = false;
            response.data = {
                code: 400,
                msg: error.message
            }
            return response;
        }
    }

    async constructObjToSend(endpoint) {
        let resTxnData = null;
        console.log(`zerox.spot.order.createOrder.url: ${endpoint}`)
        await this.axiosInstance.get(endpoint).then(txnData => {
            resTxnData = {
                from: '',
                to: txnData.data.to,
                // value: ethers.utils.parseEther(txnData.value),
                value: txnData.data.value,
                // nonce: connection.getTransactionCount(address2, 'latest'),
                data: txnData.data.data,
                chainId: txnData.data.chainId,
                // gasLimit: txnData.data.gasLimit,
                gasPrice: txnData.data.gasPrice,
                gasLimit: ethers.BigNumber.from(1110000),
                buyTokenAddress: txnData.data.buyTokenAddress,
                sellTokenAddress: txnData.data.sellTokenAddress,
            }
        }).catch(err=>{
            console.log(`zerox.spot.order.createOrder.err: ${err.message}`)
        })
        return resTxnData;
    }
}



module.exports = { Order }