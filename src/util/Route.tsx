import React from "react";
import {RouteProps} from "react-router";
import {Redirect, Route as ReactRouterDOMRoute} from "react-router-dom";
import {ErrorBoundary} from "./ErrorBoundary";

interface Props extends RouteProps {
    /** 路由匹配的组件 */
    component: React.ComponentType<any>;
    /** 是否开启错误捕获 */
    withErrorBoundary?: boolean;
    /** 允许访问当前路由的条件 */
    accessCondition?: boolean;
    /** 若不符合访问条件，重定向到指定路由的地址 */
    unauthorizedRedirectTo?: string;
}

export class Route extends React.PureComponent<Props> {
    static defaultProps: Pick<Props, "exact" | "withErrorBoundary" | "accessCondition" | "unauthorizedRedirectTo"> = {
        exact: true,
        withErrorBoundary: true,
        accessCondition: true,
        unauthorizedRedirectTo: "/",
    };

    render() {
        const {component, withErrorBoundary, accessCondition, unauthorizedRedirectTo, ...restProps} = this.props;
        const TargetComponent = component;
        const routeNode = <ReactRouterDOMRoute {...restProps} render={props => (accessCondition ? <TargetComponent {...props} /> : <Redirect to={{pathname: unauthorizedRedirectTo}} />)} />;
        return withErrorBoundary ? <ErrorBoundary>{routeNode}</ErrorBoundary> : routeNode;
    }
}
