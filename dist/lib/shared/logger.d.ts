export interface ILogger {
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'off';
export declare class DefaultLogger implements ILogger {
    private logLevel;
    name: string;
    constructor(logLevel?: LogLevel, name?: string);
    setLogLevel(level: LogLevel): void;
    getLogLevel(): LogLevel;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
export declare function setGlobalLogLevel(level: LogLevel): void;
export declare function getGlobalLogLevel(): LogLevel;
export declare function createLogger(name: string, level?: LogLevel): DefaultLogger;
