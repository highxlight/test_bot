const {PublicSocket} = require('./public/publicSocket');
const {PrivateSocekt} = require('./private/privateSocekt')


class Socket{

    constructor(name, apiKey, secretKey, socketUrl) {
        this.privateSocket = new PrivateSocekt(name, apiKey, secretKey, socketUrl);
        this.publicSocket = new PublicSocket(socketUrl)
    }
}

module.exports = {Socket};