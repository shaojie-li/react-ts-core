import React from "react";
import {connect, DispatchProp} from "react-redux";
import {Prompt} from "react-router";
import {Location} from "history";
import {State} from "../state";

interface OwnProps {
    message: ((isSamePage: boolean) => string) | string;
}

interface StateProps {
    isPrevented: boolean;
}

interface Props extends OwnProps, StateProps, DispatchProp {}

class Component extends React.PureComponent<Props, State> {
    componentDidUpdate(prevProps: Readonly<Props>): void {
        const {message, isPrevented} = this.props;
        if (prevProps.isPrevented !== isPrevented) {
            window.onbeforeunload = isPrevented ? () => message : null;
        }
    }

    getMessage = (location: Location): string => {
        const {message} = this.props;
        if (typeof message === "string") {
            return message;
        } else {
            return message(location.pathname === window.location.pathname);
        }
    };

    render() {
        const {isPrevented} = this.props;
        // Prompt组件主要作用是,在用户准备离开该页面时, 弹出提示, 返回true或者false, 如果为true, 则离开页面, 如果为false, 则停留在该页面
        return <Prompt message={this.getMessage} when={isPrevented} />;
    }
}

const mapStateToProps = (state: State): StateProps => ({isPrevented: state.navigationPrevented});

export const NavigationGuard = connect(mapStateToProps)(Component);
