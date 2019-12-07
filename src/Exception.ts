export abstract class Exception {
    protected constructor(public message: string) {}
}

export class APIException extends Exception {
    constructor(message: string, public statusCode: number, public requestURL: string, public responseData: any, public errorId: string | null, public errorCode: string | null) {
        super(message);
    }
}

export class NetworkConnectionException extends Exception {
    constructor(message: string, public requestURL: string) {
        super(message);
    }
}

export class RuntimeException extends Exception {
    constructor(message: string, public errorObject: any) {
        super(message);
    }
}

export class ReactLifecycleException extends Exception {
    constructor(public message: string, public componentStack: string) {
        super(message);
    }
}

export class BizException extends Exception {
    constructor(public message: string) {
        super(message);
    }
}
