const { checkSession } = require('../account/index.js');
const { foreverStart, foreverStop, getScriptFileNameForForever } = require('../../system');

const start = async ({ token, data }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    return await foreverStart(getScriptFileNameForForever(data));
};
const stop = async ({ token, data }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    return await foreverStop(getScriptFileNameForForever(data));
};

module.exports = {
    start,
    stop,
};
