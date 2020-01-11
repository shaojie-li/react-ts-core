import {SagaIterator} from "./typed-saga";
import {put} from "redux-saga/effects";
import {app} from "./app";
import {Exception} from "./Exception";
import {Module, ModuleLifecycleListener} from "./platform/Module";
import {ModuleProxy} from "./platform/ModuleProxy";
import {Action, errorAction, setStateAction} from "./reducer";
import {ErrorListener} from "./errorListener";

export interface LifecycleDecoratorFlag {
    isLifecycle?: boolean;
}

export interface TickIntervalDecoratorFlag {
    tickInterval?: number;
}

export type ActionHandler = (...args: any[]) => SagaIterator;

export type ErrorHandler = (error: Exception) => SagaIterator;

type ActionCreator<H> = H extends (...args: infer P) => SagaIterator ? (...args: P) => Action<P> : never;
type HandlerKeys<H> = {[K in keyof H]: H[K] extends (...args: any[]) => SagaIterator ? K : never}[Exclude<keyof H, keyof ModuleLifecycleListener | keyof ErrorListener>];
export type ActionCreators<H> = {readonly [K in HandlerKeys<H>]: ActionCreator<H[K]>};

export function register<M extends Module<any>>(module: M): ModuleProxy<M> {
    const moduleName = module.name;
    if (!app.store.getState().app[moduleName]) {
        // 获取私有属性
        const initialState = (module as any).initialState;
        app.store.dispatch(setStateAction(moduleName, initialState, `@@${moduleName}/@@init`));
        console.info(`Module [${moduleName}] registered`);
    }

    // 将每个方法转换为actioncreator
    const actions: any = {};
    getKeys(module).forEach(actionType => {
        const method = module[actionType];
        // 附加的action name, 作用于 @Log
        const qualifiedActionType = `${moduleName}/${actionType}`;
        method.actionName = qualifiedActionType;
        actions[actionType] = (...payload: any[]): Action<any[]> => ({type: qualifiedActionType, payload});
        app.actionHandlers[qualifiedActionType] = method.bind(module);
    });

    // 执行 register action
    const lifecycleListener = module as ModuleLifecycleListener;
    if (lifecycleListener.onRegister.isLifecycle) {
        app.store.dispatch(actions.onRegister());
    }

    return new ModuleProxy(module, actions);
}

export function* executeAction(handler: ActionHandler, ...payload: any[]): SagaIterator {
    try {
        yield* handler(...payload);
    } catch (error) {
        yield put(errorAction(error));
    }
}

function getKeys<M extends Module<any>>(module: M) {
    // 不要使用object.keys（object.getprototypeof（module）），因为此方法不可枚举
    const keys: string[] = [];
    for (const propertyName of Object.getOwnPropertyNames(Object.getPrototypeOf(module))) {
        if (module[propertyName] instanceof Function && propertyName !== "constructor") {
            keys.push(propertyName);
        }
    }
    return keys;
}
