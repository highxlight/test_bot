const child_process = require("child_process");
const CmdUtil = require("./CmdUtil");

class ChildProcessUtil {
    static async run(cmdScripts, exitCallBack) {
        return new Promise((resolve, reject) => {
            const workerProcess = child_process.exec(cmdScripts, function (error, stdout, stderr) {
                if (error) {
                    console.log(error.stack);
                    console.log('Error code: ' + error.code);
                    console.log('Signal received: ' + error.signal);
                    reject(error)
                } else {
                    resolve(CmdUtil.stdoutToString(stdout))
                }
            });
            workerProcess.on('exit', function (code) {
                try {
                    if (typeof exitCallBack === "function") {
                        exitCallBack(code);
                    }
                } catch (e) {
                    console.error("error run exitCallBack", e)
                }
            });
        });
    }
}

module.exports = ChildProcessUtil
