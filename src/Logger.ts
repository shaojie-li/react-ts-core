import {app} from "./app";
import {APIException, Exception, NetworkConnectionException, RuntimeException} from "./Exception";
import {ReactLifecycleException} from "./Exception";
import {loggerContext} from "./platform/loggerContext";

interface Log {
    date: Date;
    result: "OK" | "WARN" | "ERROR";
    context: {[key: string]: string}; // 存储索引数据（用于弹性搜索）
    info: {[key: string]: string}; // 存储文本数据（无索引）
    elapsedTime: number;
    action?: string;
    errorCode?: string;
}

/**
 * 如果event logger配置在非开发环境
 * 所有收集的日志将每隔{sendingfrequency}秒自动发送到{serverurl}
 *
 * 请求将以以下格式发送到服务器
 * events: Log[]}
 */
export interface LoggerConfig {
    /** 发送日志的接口地址 */
    serverURL: string;
    /** 发送日志间隔时间 */
    sendingFrequency: number;
    /** 屏蔽的关键字 */
    maskedKeywords?: RegExp[];
}

export interface Logger {
    addContext(context: {[key: string]: string | (() => string)}): void;

    /**
     * 添加一条result OK的日志
     */
    info(action: string, info?: {[key: string]: string}): () => void;

    /**
     * 添加一条result WARN的日志
     * @errorCode: 以大写和下划线命名, e.g: SOME_DATA
     */
    warn(errorCode: string, action?: string, info?: {[key: string]: string}): () => void;

    /**
     * 添加一条result ERROR的日志
     * @errorCode: 以大写和下划线命名, e.g: SOME_DATA
     */
    error(errorCode: string, action?: string, info?: {[key: string]: string}): () => void;
}

export class LoggerImpl implements Logger {
    private environmentContext: {[key: string]: string | (() => string)} = {};
    private logQueue: Log[] = [];

    constructor() {
        this.environmentContext = loggerContext;
    }

    addContext(context: {[key: string]: string | (() => string)}): void {
        this.environmentContext = {...this.environmentContext, ...context};
    }

    info(action: string, info?: {[key: string]: string}): () => void {
        return this.appendLog("OK", action, undefined, info);
    }

    warn(errorCode: string, action?: string, info?: {[key: string]: string}): () => void {
        return this.appendLog("WARN", action, errorCode, info);
    }

    error(errorCode: string, action?: string, info?: {[key: string]: string}): () => void {
        return this.appendLog("ERROR", action, errorCode, info);
    }

    exception(exception: Exception): () => void {
        if (exception instanceof NetworkConnectionException) {
            return this.appendLog("WARN", undefined, "NETWORK_FAILURE", {errorMessage: exception.message});
        } else {
            const info: {[key: string]: string} = {errorMessage: exception.message};
            let errorCode: string = "ERROR";

            if (exception instanceof APIException) {
                errorCode = `API_ERROR:${exception.statusCode}`;
                info.requestURL = exception.requestURL;
                if (exception.errorCode) {
                    info.errorCode = exception.errorCode;
                }
                if (exception.errorId) {
                    info.errorId = exception.errorId;
                }
            } else if (exception instanceof ReactLifecycleException) {
                errorCode = "LIFECYCLE_ERROR";
                info.stackTrace = exception.componentStack;
                info.appState = JSON.stringify(app.store.getState().app);
            } else if (exception instanceof RuntimeException) {
                errorCode = "JS_ERROR";
                info.stackTrace = JSON.stringify(exception.errorObject);
                info.appState = JSON.stringify(app.store.getState().app);
            }

            return this.appendLog("ERROR", undefined, errorCode, info);
        }
    }

    collect(): Log[] {
        return this.logQueue;
    }

    empty(): void {
        this.logQueue = [];
    }

    private appendLog(result: "OK" | "WARN" | "ERROR", action?: string, errorCode?: string, info?: {[key: string]: string}): () => void {
        const completeContext = {};
        Object.entries(this.environmentContext).map(([key, value]) => {
            completeContext[key] = typeof value === "string" ? value : value();
        });

        const event: Log = {
            date: new Date(),
            result,
            action,
            errorCode,
            info: info || {},
            context: completeContext,
            elapsedTime: 0,
        };

        this.logQueue.push(event);
        return () => {
            event.elapsedTime = new Date().getTime() - event.date.getTime();
        };
    }
}
