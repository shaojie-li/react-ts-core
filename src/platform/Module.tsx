import {push} from "connected-react-router";
import {Location} from "history";
import {SagaIterator} from "redux-saga";
import {app} from "../app";
import {Logger} from "../Logger";
import {LifecycleDecoratorFlag, TickIntervalDecoratorFlag} from "../module";
import {navigationPreventionAction, setStateAction} from "../reducer";
import {State} from "../state";

export interface ModuleLifecycleListener<RouteParam extends {} = {}, HistoryState extends {} = {}> {
    onRegister: (() => SagaIterator) & LifecycleDecoratorFlag;
    onRender: ((routeParameters: RouteParam, location: Location<HistoryState | undefined>) => SagaIterator) & LifecycleDecoratorFlag;
    onDestroy: (() => SagaIterator) & LifecycleDecoratorFlag;
    onTick: (() => SagaIterator) & LifecycleDecoratorFlag & TickIntervalDecoratorFlag;
}

export class Module<ModuleState extends {}, RouteParam extends {} = {}, HistoryState extends {} = {}, RootState extends State = State> implements ModuleLifecycleListener<RouteParam, HistoryState> {
    constructor(readonly name: string, readonly initialState: ModuleState) {}

    /**
     * 第一次注册模块时调用
     * 通常用于获取配置
     */
    *onRegister(): SagaIterator {
        // do something
    }

    /**
     * 当组件处于以下状态时调用：
     * - 首次加载
     * - location发生变化时（仅适用于绑定了路由的组件）
     */
    *onRender(routeParameters: RouteParam, location: Location<HistoryState | undefined>): SagaIterator {
        // do something
    }

    /**
     * 组件销毁时调用
     */
    *onDestroy(): SagaIterator {
        // do something
    }

    /**
     * 定时任务
     * 通常与 @interval 装饰器一起使用，单位（秒）
     */
    *onTick(): SagaIterator {
        // do something
    }

    /**
     * 当前模块的初始化redux状态
     */
    protected get state(): Readonly<ModuleState> {
        return this.rootState.app[this.name];
    }

    /**
     * 初始化的全局redux状态
     */
    protected get rootState(): Readonly<RootState> {
        return app.store.getState() as Readonly<RootState>;
    }

    /**
     *
     * 前端监控日志收集
     *
     */
    protected get logger(): Logger {
        return app.logger;
    }

    /**
     * 当用户要离开或刷新当前页面时，会提示用户是否离开
     *
     * 一般用于表单编辑未完成时提示用户
     *
     * @param isPrevented 是否暂时阻止离开当前页面
     */
    protected setNavigationPrevented(isPrevented: boolean) {
        app.store.dispatch(navigationPreventionAction(isPrevented));
    }

    /**
     *
     * 更新redux状态，这里的setState的作用在于更改redux状态，不同于react的setState
     *
     * 此方法相比一般的更改redux的写法，减少了大量的样板代码，你不用关心action、reducer、action_name之类的东西
     *
     * 你只需要知道更新当前模块的哪些数据，以及更新的结果
     *
     * @param newState 新的redux状态
     *
     */
    protected setState(newState: Partial<ModuleState>) {
        app.store.dispatch(setStateAction(this.name, newState, `@@${this.name}/setState[${Object.keys(newState).join(",")}]`));
    }

    /**
     * 路由跳转
     *
     * @param urlOrState url或者state
     * @param state 传递状态
     */
    protected setHistory(urlOrState: HistoryState | string, state: HistoryState | null = null) {
        if (typeof urlOrState === "string") {
            if (state === null) {
                app.store.dispatch(push(urlOrState));
            } else {
                app.store.dispatch(push(urlOrState, state));
            }
        } else {
            if (state !== null) {
                throw new Error("Second argument [state] should not bet set here");
            }
            const currentURL = location.pathname + location.search;
            app.store.dispatch(push(currentURL, urlOrState));
        }
    }
}
