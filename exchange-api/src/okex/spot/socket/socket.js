const {PublicSocket} = require('./public/publicSocket');
const {PrivateSocekt} = require('./private/privateSocekt')


class Socket{

    constructor(name, apiKey, secretKey, passphrase, socketUrl) {
        this.privateSocket = new PrivateSocekt(name, apiKey,secretKey, passphrase, socketUrl);
        this.publicSocket = new PublicSocket(socketUrl)
    }
}

module.exports = {Socket};