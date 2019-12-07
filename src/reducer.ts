import {connectRouter} from "connected-react-router";
import {History} from "history";
import {Action as ReduxAction, combineReducers, Reducer} from "redux";
import {Exception, RuntimeException} from "./Exception";
import {State} from "./state";

// Redux State
interface LoadingState {
    [loading: string]: number;
}

// Redux Action
export interface Action<P> extends ReduxAction<string> {
    name?: string;
    payload: P;
}

// Redux Action: SetState (更新 state.app 状态)
const SET_STATE_ACTION = "@@framework/setState";

interface SetStateActionPayload {
    module: string;
    state: any;
}

export function setStateAction(module: string, state: object, type: string): Action<SetStateActionPayload> {
    return {
        type,
        name: SET_STATE_ACTION,
        payload: {module, state},
    };
}

function setStateReducer(state: State["app"] = {}, action: Action<any>): State["app"] {
    // 简化reducer操作，减少模版代码
    if (action.name === SET_STATE_ACTION) {
        const {module, state: moduleState} = action.payload as SetStateActionPayload;
        return {...state, [module]: {...state[module], ...moduleState}};
    }
    return state;
}

// Redux Action: Loading (更新 state.loading 状态)
interface LoadingActionPayload {
    identifier: string;
    show: boolean;
}

export const LOADING_ACTION = "@@framework/loading";

export function loadingAction(show: boolean, identifier: string = "global"): Action<LoadingActionPayload> {
    return {
        type: LOADING_ACTION,
        payload: {identifier, show},
    };
}

function loadingReducer(state: LoadingState = {}, action: Action<LoadingActionPayload>): LoadingState {
    if (action.type === LOADING_ACTION) {
        const payload = action.payload as LoadingActionPayload;
        const count = state[payload.identifier] || 0;
        return {
            ...state,
            [payload.identifier]: count + (payload.show ? 1 : -1),
        };
    }
    return state;
}

interface NavigationPreventionActionPayload {
    isPrevented: boolean;
}

const NAVIGATION_PREVENTION_ACTION = "@@framework/navigation-prevention";

export function navigationPreventionAction(isPrevented: boolean): Action<NavigationPreventionActionPayload> {
    return {
        type: NAVIGATION_PREVENTION_ACTION,
        payload: {isPrevented},
    };
}

function navigationPreventionReducer(state: boolean = false, action: Action<NavigationPreventionActionPayload>): boolean {
    if (action.type === NAVIGATION_PREVENTION_ACTION) {
        const payload = action.payload as NavigationPreventionActionPayload;
        return payload.isPrevented;
    }
    return state;
}

// Redux Action: Error (saga处理)
export const ERROR_ACTION_TYPE: string = "@@framework/error";

export function errorAction(error: any): Action<Exception> {
    if (process.env.NODE_ENV === "development") {
        console.warn("Error Caught:", error);
    }

    const exception: Exception = error instanceof Exception ? error : new RuntimeException(error && error.message ? error.message : "unknown error", error);
    return {
        type: ERROR_ACTION_TYPE,
        payload: exception,
    };
}

// Root Reducer
export function rootReducer(history: History): Reducer<State> {
    return combineReducers<State>({
        router: connectRouter(history),
        loading: loadingReducer,
        app: setStateReducer,
        navigationPrevented: navigationPreventionReducer,
    });
}

// 判断 loading 是否为true
export function showLoading(state: State, identifier: string = "global") {
    return state.loading[identifier] > 0;
}
