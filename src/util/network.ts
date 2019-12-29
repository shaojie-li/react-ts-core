import axios, {AxiosError, AxiosRequestConfig, Method, AxiosResponse, Canceler} from "axios";

import {APIException, NetworkConnectionException, BizException} from "../Exception";
import {parseWithDate} from "./json";

const CancelToken = axios.CancelToken;

let cancelAjax: Canceler;

axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

axios.defaults.transformRequest = [
    data => {
        let formDataSearch = "";
        for (const key in data) {
            if (data.hasOwnProperty(key) && (data[key] || data[key] === 0 || typeof data[key] === "boolean")) {
                formDataSearch += encodeURIComponent(key) + "=" + encodeURIComponent(data[key]) + "&";
            }
        }
        return formDataSearch.substring(0, formDataSearch.lastIndexOf("&"));
    },
];

axios.defaults.transformResponse = (data, headers) => {
    const contentType = headers["content-type"];
    if (contentType && contentType.startsWith("application/json")) {
        return parseWithDate(data);
    }
    return data;
};

axios.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
        if (!error.config) {
            throw new BizException("取消请求");
        }
        const url = error.config.url!;
        if (error.response) {
            const responseData = error.response.data;
            const statusCode = error.response.status;
            const errorMessage = responseData && responseData.message ? responseData.message : `请求失败-（${statusCode || "未知"}）: ${url}`;
            const errorId = responseData && responseData.id ? responseData.id : null;
            const errorCode = responseData && responseData.errorCode ? responseData.errorCode : null;

            if (!errorId && (error.response.status === 502 || error.response.status === 504)) {
                throw new NetworkConnectionException(`服务端错误 - ${error.response.status}`, url);
            } else {
                throw new APIException(errorMessage, error.response.status, url, responseData, errorId, errorCode);
            }
        } else {
            throw new NetworkConnectionException(`请求错误 - ${url}`, url);
        }
    }
);

export async function ajax<Request, Response>(method: Method, path: string, pathParams: object, request: Request): Promise<AxiosResponse<Response>> {
    const config: AxiosRequestConfig = {
        method,
        url: url(path, pathParams),
        cancelToken: new CancelToken(function executor(c) {
            cancelAjax = c;
        }),
    };

    if (method === "GET" || method === "DELETE") {
        config.params = request;
    } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        config.data = request;
    }

    const response = await axios.request(config);
    return response;
}

export function url(pattern: string, params: object): string {
    if (!params) {
        return pattern;
    }
    let url = pattern;
    Object.entries(params).forEach(([name, value]) => {
        const encodedValue = encodeURIComponent(value.toString());
        url = url.replace(":" + name, encodedValue);
    });
    return url;
}

export {cancelAjax};
