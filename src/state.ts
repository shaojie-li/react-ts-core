import {RouterState} from "connected-react-router";

interface LoadingState {
    [loading: string]: number;
}

export interface State {
    loading: LoadingState;
    router: RouterState;
    navigationPrevented: boolean;
    app: {};
}
