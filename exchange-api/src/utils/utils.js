const axios = require("axios");
const Websocket = require('ws');
const events = require('events');
const zlib = require('zlib');
const moment = require('moment');
const Decimal = require('decimal.js');
const {createHmac, createHash} =require('crypto');
const logger = require('./logger');
const {allEnvConfig, envConfg} = require('../../config');

/**
 *
 * @param {string} exchangeName indicates the api in order to create the presigned for the api. case insensitive
 * @param {string} secretKey the secret key of the api
 * @param {string} queryString the query string of URL without '?'. For Huobi, it is assumed that the queryString is formatted in the right order
 * @param {string} method the HTTP Method, case insensitive as this function will convert it according to the type
 * @param {string} baseURL the base url of the HTTP
 * @param {string} endpoint the request path of the method
 * @param {number} timestamp the unix timestamp in milliseconds. It is recommended to pass the timestamp to ensure the timestamp is within the recvWindow of the API
 * @param {object} requestBody the request body when creating post request, it will convert into string according to what is the exchange name
 * @returns a hashed string for signing the request.
 */
function createSignature(exchangeName,secretKey,queryString='',method=null,endpoint=null,timestamp=null,requestBody=null,baseURL=null){
    var presigned='';

    switch(exchangeName.toLowerCase()){
        case 'binance':
            if(method.toUpperCase()==='POST'){
                var params

                Object.keys(requestBody).forEach((key)=>{
                    if(requestBody[key]){
                        params+=`${key}=${requestBody[key]}&`
                    }
                });

                params=params.substring(0,params.length-1);

                presigned=params;
            }else{
                // queryString=timestamp ? `${queryString}&timestamp=${timestamp}` : queryString;
                presigned=queryString;
            }
            break;
        case 'ftx':
            requestBody=requestBody?JSON.stringify(requestBody):'';
            presigned=timestamp+method.toUpperCase()+endpoint+queryString+requestBody;
            break;
        case 'huobi':
            presigned=method.toUpperCase()+'\n'
                        +baseURL.replace('https://','')+'\n'
                        +endpoint+'\n'
                        +queryString;
            break;
        case 'gate.io':
            requestBody=requestBody ? JSON.stringify(requestBody) : '';
            let hashedPayload=createHash('sha512').update(requestBody).digest('hex');
            presigned = [method.toUpperCase(), endpoint, queryString, hashedPayload, timestamp].join('\n');
            break;
        case 'kucoin':
            requestBody=requestBody ? JSON.stringify(requestBody) : '';
            presigned=timestamp.toString()+method.toUpperCase()+endpoint+requestBody.toString();
            break;
        // bybit needs to modify so that it can deal with the request body
        case 'bybit':
            presigned=queryString;
            break;
        case 'okex':
            presigned=timestamp+method.toUpperCase()+endpoint+queryString;
            break;
        case 'deribit':
            requestBody=requestBody ? JSON.stringify(requestBody) : '';
            let requestData=method.toUpperCase()+'\n'+endpoint+'\n'+requestBody+'\n';
            presigned=timestamp+'\n'+queryString+'\n'+requestData;
            break;
        case 'bitmex':
            requestBody=requestBody ? JSON.stringify(requestBody) : '';
            presigned=method.toUpperCase()+endpoint+timestamp+requestBody;
            break;
        case 'bitmart':
            presigned= queryString;
            break;
        case 'aax':
            requestBody=requestBody ? JSON.stringify(requestBody) : '';
            presigned= `${timestamp}:${method}${endpoint}${requestBody}`;
            break;
        case 'coinex':
            // 签名方式不一样 用 method 来做判断
            presigned = '';
            if(method === 'future'){
                presigned = queryString;
            }else{
                if(requestBody){
                    var keys = Object.keys(requestBody).sort();
                    presigned = keys[0] + "=" + requestBody[keys[0]];
                    for (var i = 1; i < keys.length; i++) {
                        presigned += "&" + keys[i] + "=" + requestBody[keys[i]];
                    }
                }
            }
            presigned += `&secret_key=${secretKey}`;
            break;
        case 'bitrue':
            presigned= queryString;
            break;
        case 'poloniex':
            presigned= queryString;
            break;
        case 'digifinex':
            presigned= queryString;
            break;
        default:
            break;
    }
    if(exchangeName.toLowerCase()==='gate.io' || exchangeName.toLowerCase() === 'poloniex'){
        if(method === 'future'){
            return createHmac('sha256',secretKey).update(presigned).digest('hex');
        }else{
            return createHmac('sha512',secretKey).update(presigned).digest('hex');
        }

    }else if(exchangeName.toLowerCase()==='kucoin' || exchangeName.toLowerCase()==='huobi' ||  exchangeName.toLowerCase()==='okex' ){
        return createHmac('sha256',secretKey)
            .update(presigned)
            .digest('base64');
    }else if(exchangeName.toLowerCase() === 'coinex'){
        if(method === 'future'){
            return createHash('sha256').update(presigned).digest('hex')
        }else{
            return createHash('md5').update(presigned).digest('hex').toUpperCase()
        }
    }else{
        return createHmac('sha256',secretKey)
            .update(presigned)
            .digest('hex');
    }
}

class ExchangeInfo{
    static Binance={
        id:1,
        name:'binance',
        test:{
            baseURL:'https://testnet.binance.vision',
            futureURL: 'https://testnet.binancefuture.com',
            socketURL: 'wss://testnet.binance.vision',
            futureSocketURL:'wss://fstream.binance.com'
        },
        main:{
            baseURL: 'https://api.binance.com',
            futureURL:'https://fapi.binance.com',
            socketURL: 'wss://stream.binance.com:9443',
            futureSocketURL:'wss://fstream.binance.com'
        }
    };

    static Ftx={
        id:2,
        name:'ftx',
        test:{
            baseURL:'https://ftx.com',
            futureURL: 'https://ftx.com',
            socketURL: 'wss://ftx.com/ws/'
        },
        main:{
            baseURL:'https://ftx.com',
            futureURL: 'https://ftx.com',
            socketURL: 'wss://ftx.com/ws/'
        },
    };

    static Huobi={
        id:3,
        name:'huobi',
        test:{
            baseURL:'https://api.huobi.pro',
            futureURL: 'https://api.hbdm.com',
            socketURL: 'wss://api.huobi.pro/ws',
            futureSocketURL:'wss://api.hbdm.com/linear-swap'
        },
        main:{
            baseURL:'https://api.huobi.pro',
            futureURL: 'https://api.hbdm.com',
            socketURL: 'wss://api.huobi.pro/ws',
            futureSocketURL:'wss://api.hbdm.com/linear-swap'
        },
    };

    static Gateio={
        id:4,
        name:'gate.io',
        test:{
            baseURL:'https://api.gateio.ws',
            futureURL: 'https://fx-api-testnet.gateio.ws',
            socketURL: 'wss://api.gateio.ws/ws/v4/',
            futureSocketURL:'wss://fx-ws-testnet.gateio.ws/v4/ws/usdt'
        },
        main:{
            baseURL:'https://api.gateio.ws',
            futureURL: 'https://fx-api.gateio.ws',
            socketURL: 'wss://api.gateio.ws/ws/v4/',
            futureSocketURL:'wss://fx-ws.gateio.ws/v4/ws/usdt'
        },
    };

    static Kucoin={
        id:5,
        name:'kucoin',
        test:{
            baseURL:'https://openapi-sandbox.kucoin.com',
            futureURL: 'https://api-sandbox-futures.kucoin.com',
            socketURL: 'wss://push1-v2.kucoin.com/ws'
        },
        main:{
            baseURL:'https://api.kucoin.com',
            futureURL: 'https://api-futures.kucoin.com',
            socketURL: 'wss://push1-v2.kucoin.com/ws'
        }
    };

    static Bybit={
        id:6,
        name:'bybit',
        test:{
            baseURL:'https://api-testnet.bybit.com',
            futureURL: 'https://api-testnet.bybit.com',
            socketURL: 'wss://stream-testnet.bybit.com/spot',
            futureSocketURL: 'wss://stream-testnet.bybit.com/realtime'
        },
        main:{
            baseURL:'https://api.bybit.com',
            futureURL: 'https://api.bybit.com',
            socketURL: ' wss://stream.bybit.com/spot',
            futureSocketURL:'wss://stream.bybit.com/realtime'
        }
    };

    static Okex={
        id: 7,
        name: 'okex',
        test:{
            baseURL:'https://www.okex.com',
            futureURL: 'https://www.okex.com',
            socketURL: 'wss://ws.okx.com:8443/ws/v5'
        },
        main:{
            baseURL:'https://www.okex.com',
            futureURL: 'https://www.okex.com',
            socketURL: 'wss://ws.okx.com:8443/ws/v5'
        }
    };

    static Deribit={
        id: 8,
        name: 'deribit',
        test:{
            baseURL:'https://test.deribit.com',
            futureURL: 'https://test.deribit.com',
            socketURL: 'wss://test.deribit.com/ws/api/v2'
        },
        main:{
            baseURL:'https://www.deribit.com',
            futureURL: 'https://www.deribit.com',
            socketURL: 'wss://ws.deribit.com/ws/api/v2'
        }
    };

    static BitMex={
        id: 9,
        name: 'bitmex',
        test:{
            baseURL:'https://testnet.bitmex.com',
            futureURL: 'https://testnet.bitmex.com',
            socketURL: 'wss://testnet.bitmex.com/realtime'
        },
        main:{
            baseURL:'https://www.bitmex.com',
            futureURL: 'https://www.bitmex.com',
            socketURL: 'wss://ws.bitmex.com/realtime'
        }
    };
    static  BitMart={
        id: 10,
        name: 'bitmart',
        test:{
            baseURL:'https://api-cloud.bitmart.com',
            futureURL: 'https://api-cloud.bitmart.com',
            socketURL: 'wss://ws-manager-compress.bitmart.com'
        },
        main:{
            baseURL:'https://api-cloud.bitmart.com',
            futureURL: 'https://api-cloud.bitmart.com',
            socketURL: 'wss://ws-manager-compress.bitmart.com'
        }
    };
    static Aax={
        id: 11,
        name: 'aax',
        test:{
            baseURL:'https://api.aax.com',
            futureURL: 'https://api.aax.com',
            socketURL: 'wss://realtime.aax.com',
            privateSocketURL: 'wss://stream.aax.com/notification/v2/'
        },
        main:{
            baseURL:'https://api.aax.com',
            futureURL: 'https://api.aax.com',
            socketURL: 'wss://realtime.aax.com',
            privateSocketURL: 'wss://stream.aax.com/notification/v2/'
        }
    };
    static CoinEx={
        id: 12,
        name: 'coinex',
        test:{
            baseURL:'https://api.coinex.com/v1',
            futureURL: 'https://api.coinex.com/perpetual/v1',
            socketURL: 'wss://socket.coinex.com/',
            futureSocketURL: 'wss://perpetual.coinex.com/'
        },
        main:{
            baseURL:'https://api.coinex.com/v1',
            futureURL: 'https://api.coinex.com/perpetual/v1',
            socketURL: 'wss://socket.coinex.com/',
            futureSocketURL: 'wss://perpetual.coinex.com/'
        }
    }

    static BitRue={
        id: 13,
        name: 'bitrue',
        test:{
            baseURL:'https://open.bitrue.com',
            socketURL: 'wss://wsapi.bitrue.com'
        },
        main:{
            baseURL:'https://open.bitrue.com',
            socketURL: 'wss://wsapi.bitrue.com'
        }
    }

    static PoloNiex={
        id: 14,
        name: 'poloniex',
        test:{
            baseURL:'https://poloniex.com',
            socketURL: 'wss://api2.poloniex.com',
            futureURL: 'https://futures-api.poloniex.com'
        },
        main:{
            baseURL:'https://poloniex.com',
            socketURL: 'wss://api2.poloniex.com',
            futureURL: 'https://futures-api.poloniex.com'
        }
    }
    static Digifinex={
        id: 14,
        name: 'digifinex',
        test:{
            baseURL:'https://openapi.digifinex.com/v3',
            socketURL: 'wss://openapi.digifinex.com/ws/v1/'
        },
        main:{
            baseURL:'https://openapi.digifinex.com/v3',
            socketURL: 'wss://openapi.digifinex.com/ws/v1/'
        }
    }


    static Zerox={
        id: 10,
        name: 'zerox',
        mainnet: 'https://api.0x.org',
        binance: 'https://bsc.api.0x.org',
        ropsten: 'https://ropsten.api.0x.org',
        polygon: 'https://polygon.api.0x.org',
        avalanche: 'https://avalanche.api.0x.org',
        fantom: 'https://fantom.api.0x.org',
        celo: 'https://celo.api.0x.org',
        optimism:  'https://optimism.api.0x.org',
        socketURL: 'wss://api.0x.org/orderbook/v1'
    }
}

/**
 *
 * @param {object} object
 * @returns a query string assembled using the given object keys and values
 *
 * This method is to convert a request body into a query string
 */
function assembleQueryString(object){
    let queryString='';
    Object.keys(object).forEach((key)=>{
        queryString+=key+'='+object[key]+'&';
    });
    queryString=queryString.substring(0,queryString.length-1);

    return queryString;
}
/**
 * The ClientOid field is the unique ID created by the client (UUID is recommended)
 * and can contain only numbers, letters, underscores (_), and delimited lines (-).
 * @returns {Promise<string>}
 */
function getUuid() {
    let d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 *  Single usage, user generated initialization vector for the server token
 * @param e     String length
 * @returns {string}
 */
function randString(e) {
    e = e || 32;
    var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n
}

function getDecimal(str){
    let precision = 0
    str = str.toString().replace(/(0+)$/g, '');
    if(Math.floor(str) > 0){
        precision = Math.floor(str)
    }else{
        precision = str.toString().split('.')[1].length;
    }
    return precision;
}

function numToString(num){
    let result = num.toString();
    if (result.indexOf('-') >= 0) {
        result = '0' + String(Number(result) + 1).substr(1);
    }
    return result;
}



function timeFormat(str){
    let timeStr = null;
    try {
        let s = moment(str).format('YYYY-MM-DD HH:mm:ss');
        timeStr = new Date(s).getTime();
    }catch (e){
        timeStr = '';
    }
    return timeStr;
}

function dataCalculation(num1, num2, mark){
    let num = 0;
    switch (mark){
        case '+':
            num = new Decimal(num1).add(new Decimal(num2)).toNumber();
            break;
        case '-':
            num = new Decimal(num1).sub(new Decimal(num2)).toNumber();
            break;
        case '*':
            num = new Decimal(num1).mul(new Decimal(num2)).toNumber();
            break;
        case '/':
            num = new Decimal(num1).div(new Decimal(num2)).toNumber();
            break;
    }
    return num;
}


module.exports = {
    axios, Websocket, events, zlib,
    createSignature, ExchangeInfo, assembleQueryString,
    getUuid, randString, getDecimal, logger,
    allEnvConfig, envConfg, timeFormat, dataCalculation, numToString
};
