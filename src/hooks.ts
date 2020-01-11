import React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {useDispatch, useSelector} from "react-redux";

export function useLoadingStatus(identifier: string = "global"): boolean {
    return useSelector((state: State) => state.loading[identifier] > 0);
}

export function useModuleAction<P extends Array<string | number | boolean | null | undefined>>(actionCreator: (...args: P) => Action<P>, ...deps: P): () => void {
    const dispatch = useDispatch();
    return React.useCallback(() => dispatch(actionCreator(...deps)), deps);
}
