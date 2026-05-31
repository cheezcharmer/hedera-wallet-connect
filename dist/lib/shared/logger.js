var _a;
export class DefaultLogger {
    constructor(logLevel = 'info', name) {
        this.logLevel = 'info';
        this.logLevel = logLevel;
        this.name = name || 'Logger';
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    getLogLevel() {
        return this.logLevel;
    }
    error(message, ...args) {
        if (['error', 'warn', 'info', 'debug'].includes(this.logLevel)) {
            console.error(`[ERROR - ${this.name}] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (['warn', 'info', 'debug'].includes(this.logLevel)) {
            console.warn(`[WARN - ${this.name}] ${message}`, ...args);
        }
    }
    info(message, ...args) {
        if (['info', 'debug'].includes(this.logLevel)) {
            console.info(`[INFO - ${this.name}] ${message}`, ...args);
        }
    }
    debug(message, ...args) {
        if (this.logLevel === 'debug') {
            console.debug(`[DEBUG - ${this.name}] ${message}`, ...args);
        }
    }
}
// Global logger configuration
let globalLogLevel = 'info';
// Check if environment variable is set
if (typeof process !== 'undefined' && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.HWC_LOG_LEVEL)) {
    const envLevel = process.env.HWC_LOG_LEVEL.toLowerCase();
    if (['error', 'warn', 'info', 'debug', 'off'].includes(envLevel)) {
        globalLogLevel = envLevel;
    }
}
// Check if localStorage is available (browser environment)
if (typeof localStorage !== 'undefined') {
    const storedLevel = localStorage.getItem('hwc_log_level');
    if (storedLevel && ['error', 'warn', 'info', 'debug', 'off'].includes(storedLevel)) {
        globalLogLevel = storedLevel;
    }
}
export function setGlobalLogLevel(level) {
    globalLogLevel = level;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hwc_log_level', level);
    }
}
export function getGlobalLogLevel() {
    return globalLogLevel;
}
// Factory function to create logger instances
export function createLogger(name, level) {
    return new DefaultLogger(level || globalLogLevel, name);
}
