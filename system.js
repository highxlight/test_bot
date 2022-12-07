const datap = require('./datap');
const ChildProcessUtil = require('./utils/ChildProcessUtil');
const ForeverUtil = require('./utils/ForeverUtil');
const path = require('path');
const FileUtil = require('./utils/FileUtil');
const fs = require('fs');
const DbUtil = require('./utils/DbUtil');
let initDbData = require('./system_initDbData');
const { sleep } = require('./utils');

const collBotInstance = 'botInstance';
const collBot = 'bot';

async function fetchBotClassMap() {
    return await datap.mongo.read(collBot, {}).then(async (bots) => {
        const botClassFileMap = {};
        bots.forEach((bot) => {
            botClassFileMap[bot.type] = {
                rootDir: __dirname,
                scriptFile: bot.file,
            };
        });
        return botClassFileMap;
    });
}

async function fetchForeverProcess() {
    return await ChildProcessUtil.run('forever list').then(async (res) => {
        const foreverProcess = {};
        const items = ForeverUtil.parseForeverListFromStdout(res);
        items.forEach((it) => {
            const botInstanceScriptFile = path.basename(it.script);
            foreverProcess[botInstanceScriptFile] = it.uid;
        });
        return foreverProcess;
    });
}

function getScriptFileNameForForever(it) {
    return `forever_run_${(it._id || it.id).toString()}.js`;
}

async function genScriptForForever(it, botClassFileMap) {
    fs.writeFileSync(
        path.join(__dirname, getScriptFileNameForForever(it)).toString(),
        `const Bot = require("./${botClassFileMap[it.type].scriptFile}")
const bot = new Bot("${it.name}", getConfig())
bot.start()

function getConfig() {
    return    ${it.configContent}
}
`
    );
}

async function genScriptAllForForever() {
    const botClassFileMap = await fetchBotClassMap();
    const instances = await datap.mongo.read(collBotInstance, {});
    instances.map(async (it) => {
        try {
            await genScriptForForever(it, botClassFileMap);
        } catch (e) {
            console.log('error in genScriptFile', e);
        }
    });
}

async function syncForeverRunningStateToDb() {
    const foreverProcess = await fetchForeverProcess();
    const instances = await datap.mongo.read(collBotInstance, {});
    instances.forEach((it) => {
        it.isForeverRuning = foreverProcess[getScriptFileNameForForever(it)] || false;
    });
    await datap.mongo.bulkWriteUpdateInsert(collBotInstance, instances, ['name']).then((res) => {
        console.log(` instances  forever running status has updated`, res);
    });
}

async function foreverRestart(scriptFileName) {
    return foreverStop(scriptFileName).then((res) => {
        return foreverStart(scriptFileName);
    });
}

async function foreverStart(scriptFullPath) {
    const scriptFileName = path.basename(scriptFullPath);
    return fetchForeverProcess().then(async (runningProcess) => {
        const uid = runningProcess[scriptFileName];
        if (uid) {
            return uid;
        } else {
            const logFile = path.join('.', scriptFullPath + '.log');
            return ChildProcessUtil.run(`forever start -l ${logFile} -a ${scriptFileName}`).then(async (res) => {
                await sleep(3 * 1000);
                return fetchForeverProcess().then((runningProcess) => {
                    return runningProcess[scriptFileName];
                });
            });
        }
    });
}

async function foreverStop(scriptFile) {
    const scriptFileName = path.basename(scriptFile);
    return await ChildProcessUtil.run(`forever stop ${scriptFileName}`).then((outStr) => {
        return true;
    });
}

async function initAll() {
    DbUtil.initDb(initDbData);
    await syncForeverRunningStateToDb()
        .then((res) => {
            console.log('forever 运行状态更新至数据库完成');
        })
        .catch((e) => {
            console.error('forever 运行状态更新时异常', e);
        });
    await genScriptAllForForever()
        .then((res) => {
            console.log('生成 forever 运行脚本文件');
        })
        .catch((e) => {
            console.error('生成 forever 运行脚本文件异常', e);
        });
}

module.exports = {
    initAll,
    fetchForeverProcess,
    getScriptFileNameForForever,
    genScriptAllForForever,
    foreverStop,
    foreverStart,
    foreverRestart,
    fetchBotClassMap,
    genScriptForForever,
};
