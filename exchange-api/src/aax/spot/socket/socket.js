const {PublicSocket} = require('./public/publicSocket');
const {PrivateSocekt} = require('./private/privateSocekt')


class Socket{

    constructor(name, apiKey, secretKey, endpoint, privateSocketURL, socketUrl, timeout) {
        this.privateSocket = new PrivateSocekt(name, apiKey,secretKey, endpoint, privateSocketURL, timeout);
        this.publicSocket = new PublicSocket(socketUrl)
    }
}

module.exports = {Socket};