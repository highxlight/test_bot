// const mdb = require("../../datap.js");
const {checkSession} = require("../account/index.js");

const get = async ({token, data, ctx}) => {
    await checkSession({token, data: {onlyAdmin: true}});
    return {"useHooks": {"add": true, "delete": true}}
};

module.exports = {
    get,
};
