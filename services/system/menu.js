// const mdb = require("../../datap.js");
const {checkSession} = require("../account/index.js");

const list = async ({token, data, ctx}) => {
    await checkSession({token, data: {onlyAdmin: true}});
    return [
        {"icon": "HomeOutlined", "title": "机器人管理", "path": "/home/index"},
    ]
};

module.exports = {
    list,
};
