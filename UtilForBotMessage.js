const axios = require('axios');

class BotMessage {
    constructor({ thread, url }) {
        this.url = url;
        this.thread = thread;
    }

    sendMsg(msg) {
        let { url, thread } = this;
        let config = {
            method: 'post',
            url,
            headers: {
                'Content-Type': 'text/plain',
            },
            data: {
                text: msg,
                thread: { name: thread },
            },
        };
        return axios(config);
    }
}

module.exports = BotMessage;
