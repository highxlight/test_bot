const {PublicSocket} = require('./public/publicSocket');
const {PrivateSocekt} = require('./private/privateSocekt')


class Socket{

    constructor(name, apiKey, secretKey, passphrase, endpoint, timeout) {
        this.privateSocket = new PrivateSocekt(name, apiKey, secretKey, passphrase, endpoint, timeout);
        this.publicSocket = new PublicSocket(endpoint, timeout)
    }
}

module.exports = {Socket};