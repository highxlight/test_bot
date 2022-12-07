const { mongo: mg } = require('../../datap.js');
const { checkSession } = require('../account/index.js');
const { fetchForeverProcess, getScriptFileNameForForever, fetchBotClassMap, genScriptForForever } = require('../../system');
const datap = require('../../datap');
const _ = require('lodash');
const collBotInstance = 'botInstance';
const collBot = 'bot';

async function genScript(data) {
    try {
        const botClassFileMap = await fetchBotClassMap();
        await genScriptForForever(data, botClassFileMap);
    } catch (e) {}
}

const create = async ({ token, data }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    let { name, isForeverRunning = false, type, configContent } = data;
    const count = await mg.count(collBotInstance, { name });
    if (count > 0) {
        throw new Error('name has exists');
    } else {
        const it = await mg.create(collBotInstance, { name, isForeverRunning, type, configContent });
        data._id = it.insertedId;
        await genScript(data);
        return data;
    }
};
const update = async ({ token, data }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    let { _id } = data;
    if (_id) {
        data.id = _id;
        let toDb = _.pick(data, ['configContent', 'id']);
        const res = await mg.update(collBotInstance, toDb);
        await genScript(data);
        return res;
    } else {
        throw new Error('id or _id must not be empty');
    }
};
const deleteBotConfig = async ({ token, data: { id, _id } }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    const delId = (id || _id || '').toString();
    if (delId) {
        return await mg.delete(delId, collBotInstance);
    } else {
        throw new Error('id must not empty');
    }
};
const hasBotExists = async ({ token, data: { name } }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    if (name) {
        return (await mg.count(collBotInstance, { name })) > 0;
    } else {
        throw new Error('id must not empty');
    }
};

const list = async ({ token, data: { statusType } }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    const foreverProcess = await fetchForeverProcess();
    return await datap.mongo.read(collBotInstance, {}, 100, 0, { _id: -1 }).then((res) => {
        res.forEach((it) => {
            it.isForeverRunning = foreverProcess[getScriptFileNameForForever(it)] || false;
            it.forever = it.isForeverRunning ? '运行中' : '未运行';
        });
        return res;
    });
};
const botList = async ({ token, data }) => {
    await checkSession({ token, data: { onlyAdmin: true } });
    return await datap.mongo.read(collBot, {}, 100, 0, { _id: -1 });
};
module.exports = {
    list,
    botList,
    create,
    update,
    deleteBotConfig,
    hasBotExists,
};
