const axios = require("axios");
var botsend = function (msg) {
    var data = {
        text: msg,
        thread: { name: "spaces/AAAAmOGj2V8/threads/fd7Qn-jueo8" },
    };

    var config = {
        method: "post",
        url: "https://chat.googleapis.com/v1/spaces/AAAAmOGj2V8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=HqmDLm171HfwQAPQVNPgsTcWFeXvtMRc_121t4Bc3-g%3D",
        headers: {
            "Content-Type": "text/plain",
        },
        data: data,
    };

    return axios(config);
};

module.exports = botsend;
