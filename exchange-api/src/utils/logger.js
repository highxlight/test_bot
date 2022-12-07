const log4js = require('log4js');
const { consoleLog } =  require('../../config');

let appends = [];
if(consoleLog){
    appends = ['stdout','default'];
}else{
    appends = ['default'];
}

log4js.configure({
    replaceConsole: true,
    pm2: true,
    appenders: {
        stdout: {
            type: 'console'
        },
        default: {
            type: 'dateFile',
            filename: 'logs/exchange_logs/infolog/info',
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        error: {
            type: 'dateFile',
            filename: 'logs/exchange_logs/errlog/err',
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }

    },

    categories: {
        default: { appenders: appends, level: 'all' },
        error: { appenders: ['error'], level: 'warn' },
    }
});
const defaultLogger = log4js.getLogger('default');
const errorLogger = log4js.getLogger('error');
module.exports = {
    trace(){
        return defaultLogger.trace.call(defaultLogger, ...arguments)
    },
    debug(){
        return defaultLogger.debug.call(defaultLogger, ...arguments)
    },
    info(){
        return defaultLogger.info.call(defaultLogger, ...arguments)
    },
    warn(){
        return errorLogger.warn.call(errorLogger, ...arguments)
    },
    error(){
        return errorLogger.error.call(errorLogger, ...arguments)
    },
    fatal(){
        return errorLogger.fatal.call(errorLogger, ...arguments)
    },
    mark(){
        return errorLogger.mark.call(errorLogger, ...arguments)
    },
};













