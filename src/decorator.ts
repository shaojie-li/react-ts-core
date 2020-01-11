import {SagaIterator} from "./typed-saga";
import {put} from "redux-saga/effects";
import {app} from "./app";
import {ActionHandler, LifecycleDecoratorFlag, TickIntervalDecoratorFlag} from "./module";
import {ModuleLifecycleListener} from "./platform/Module";
import {loadingAction} from "./reducer";
import {stringifyWithMask} from "./util/json";
import {State} from "./state";

/**
 * 装饰器类型定义
 */
type HandlerDecorator = (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<ActionHandler>) => TypedPropertyDescriptor<ActionHandler>;
type LifecycleHandlerDecorator = (target: object, propertyKey: keyof ModuleLifecycleListener, descriptor: TypedPropertyDescriptor<ActionHandler & LifecycleDecoratorFlag>) => TypedPropertyDescriptor<ActionHandler>;
type OnTickHandlerDecorator = (target: object, propertyKey: "onTick", descriptor: TypedPropertyDescriptor<ActionHandler & TickIntervalDecoratorFlag>) => TypedPropertyDescriptor<ActionHandler>;

type HandlerInterceptor<S> = (handler: ActionHandler, rootState: Readonly<S>) => SagaIterator;

/**
 * 封装创建ActionHandler函数的方法
 */
export function createActionHandlerDecorator<S extends State = State>(interceptor: HandlerInterceptor<S>): HandlerDecorator {
    return (target, propertyKey, descriptor) => {
        const fn = descriptor.value!;
        descriptor.value = function*(...args: any[]): SagaIterator {
            const rootState: S = app.store.getState() as S;
            yield* interceptor(fn.bind(this, ...args), rootState);
        };
        return descriptor;
    };
}

/**
 * Saga执行期间处理state.loading[identifier]
 */
export function Loading(identifier: string = "global"): HandlerDecorator {
    return createActionHandlerDecorator(function*(handler) {
        try {
            yield put(loadingAction(true, identifier));
            yield* handler();
        } finally {
            yield put(loadingAction(false, identifier));
        }
    });
}

/**
 * 记录（result=ok）的action，包括action名称和参数
 */
export function Log(): HandlerDecorator {
    return (target, propertyKey, descriptor) => {
        const fn = descriptor.value!;
        descriptor.value = function*(...args: any[]): SagaIterator {
            if (app.loggerConfig) {
                const params = stringifyWithMask(app.loggerConfig.maskedKeywords || [], "***", ...args);
                const logTypeName = (descriptor.value as any).actionName;
                const onLogEnd = app.logger.info(logTypeName, params ? {params} : {});
                try {
                    yield* fn.bind(this)(...args);
                } finally {
                    onLogEnd();
                }
            } else {
                yield* fn.bind(this)(...args);
            }
        };
        return descriptor;
    };
}

/**
 * 当使用 onRender/onDestroy/...这些钩子函数时，需要用此函数作为钩子函数的装饰器
 */
export function Lifecycle(): LifecycleHandlerDecorator {
    return (target, propertyKey, descriptor) => {
        descriptor.value!.isLifecycle = true;
        return descriptor;
    };
}

/**
 * 作用于 onTick action, 时间间隔单位为秒
 */
export function Interval(second: number): OnTickHandlerDecorator {
    return (target, propertyKey, descriptor) => {
        descriptor.value!.tickInterval = second;
        return descriptor;
    };
}

/**
 * 如果执行了某一saga操作，则在执行期间不受其他操作的干扰。
 * 对错误处理有用
 */
export function Mutex(): HandlerDecorator {
    let isLocked = false;
    return createActionHandlerDecorator(function*(handler) {
        if (!isLocked) {
            try {
                isLocked = true;
                yield* handler();
            } finally {
                isLocked = false;
            }
        }
    });
}
