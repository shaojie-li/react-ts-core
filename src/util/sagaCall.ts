import {call as sagaCall, CallEffect} from "redux-saga/effects";

interface CallWithResultEffect<R> extends CallEffect {
    result: () => R;
}

export const call = <R, P extends any[]>(fn: (...args: P) => Promise<R>, ...args: P) => {
    let result: R;
    // 参数与 fn (parameter) 相同, 但是Promise的结果将被存到"result"中
    const wrappedFn = async (...args: P) => {
        const _ = await fn(...args);
        result = _;
        return _;
    };
    const effect = sagaCall.apply(null, [wrappedFn, ...args] as any) as CallWithResultEffect<R>;
    effect.result = () => {
        return result;
    };
    return effect;
};
