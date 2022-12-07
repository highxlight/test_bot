class CmdUtil {
    static stdoutToString(stdout) {
        let str = stdout.toString().replace(/\\u0000|\\u0001|\\u0002|\\u0003|\\u0004|\\u0005|\\u0006|\\u0007|\\u0008|\\u0009|\\u000a|\\u000b|\\u000c|\\u000d|\\u000e|\\u000f|\\u0010|\\u0011|\\u0012|\\u0013|\\u0014|\\u0015|\\u0016|\\u0017|\\u0018|\\u0019|\\u001a|\\u001b|\\u001c|\\u001d|\\u001e|\\u001f/g, "");
        const reg = new RegExp("\\[" + [90, 39, 37, 35, 39, 33].join("m|\\[") + "m", "gi")
        str = str.replace(reg, "");
        str = str.replace(/|:$/gi, "")
        return str
    }
}

module.exports = CmdUtil
