const util = require('util');
const fs = require('fs');

class UtilForConfig {
    static async isFile(file) {
        return util
            .promisify(fs.stat)(file)
            .then((stats) => {
                return stats.isFile();
            })
            .catch((e) => {
                return false;
            });
    }

    static async writeFileIfExists(fileName, fileContent) {
        await UtilForConfig.isFile(fileName).then((res) => {
            if (res === false) {
                fs.writeFileSync(fileName, fileContent);
                console.log(`create file ${fileName} successful `);
            }
            return true;
        });
    }

    static async loadConfig(args, configFilParamKey = 'f', defaultConfigFileName, configFileDefaultContent) {
        return new Promise(async (resolve, reject) => {
            let configFile = args[configFilParamKey];
            if (!configFile && defaultConfigFileName) {
                configFile = defaultConfigFileName;
                console.log('will using default config file', configFile);
                await UtilForConfig.writeFileIfExists(defaultConfigFileName, configFileDefaultContent);
            }
            let isExists = await UtilForConfig.isFile(configFile);
            if (isExists) {
                console.log('using  config file', configFile);
                try {
                    resolve(require(configFile));
                } catch (e) {
                    reject(`error in load config file ,${configFile} ${e}`);
                }
            } else {
                reject(`error config file not found  ,${configFile} `);
            }
        });
    }
}

module.exports = UtilForConfig;
