import React from "react";
import {connect, DispatchProp} from "react-redux";
import {ReactLifecycleException} from "../Exception";
import {errorAction} from "../reducer";

import "./error_boundary.less";

interface OwnProps {
    render: (exception: ReactLifecycleException) => React.ReactNode;
    children: React.ReactNode;
}

interface Props extends OwnProps, DispatchProp {}

interface State {
    exception: ReactLifecycleException | null;
}

class Component extends React.PureComponent<Props, State> {
    static defaultProps: Pick<Props, "render"> = {
        render: exception => (
            <div className="framework-error-catch">
                <h2>错误原因：{exception.message}</h2>
                <h2>错误详情：{exception.componentStack}</h2>
            </div>
        ),
    };
    state: State = {exception: null};

    componentDidUpdate(prevProps: Props) {
        if (this.props.children !== prevProps.children) {
            this.setState({exception: null});
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const exception = new ReactLifecycleException(error.message, errorInfo.componentStack);
        this.props.dispatch(errorAction(exception));
        this.setState({exception});
    }

    render() {
        return this.state.exception ? this.props.render(this.state.exception) : this.props.children;
    }
}

export const ErrorBoundary = connect()(Component);
