const {PublicSocket} = require('./public/publicSocket');
const {PrivateSocekt} = require('./private/privateSocekt')


class Socket{

    constructor(name, apiKey, secretKey, passphrase, endpoint, socketUrl, timeout) {
        this.privateSocket = new PrivateSocekt(name, apiKey, secretKey, passphrase, endpoint, socketUrl, timeout);
        this.publicSocket = new PublicSocket(endpoint, socketUrl, timeout)
    }
}

module.exports = {Socket};