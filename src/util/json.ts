/**
 *
 * 序列化敏感数据, e.g. password.
 * 函数和符号也在序列化中被丢弃
 *
 */
export function stringifyWithMask(maskedKeywords: RegExp[], maskedOutput: string, ...args: any[]): string | undefined {
    const replacer = (key: string, value: any) => {
        if (typeof value === "function" || typeof value === "symbol") {
            return undefined;
        }
        if (maskedKeywords.some(_ => _.test(key))) {
            return maskedOutput;
        }
        return value;
    };

    const serializableArgs = args.filter(_ => typeof _ !== "function" && typeof _ !== "symbol");
    switch (serializableArgs.length) {
        case 0:
            return undefined;
        case 1:
            return JSON.stringify(serializableArgs[0], replacer);
        default:
            return JSON.stringify(serializableArgs, replacer);
    }
}

/**
 * 如果json中出现iso格式的日期（2018-05-24t12:00:00.123z），则它将转换为js日期类型。
 */
export function parseWithDate(data: string) {
    const ISO_DATE_FORMAT = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-][01]\d:[0-5]\d)$/;
    return JSON.parse(data, (key: any, value: any) => {
        if (typeof value === "string" && ISO_DATE_FORMAT.test(value)) {
            return new Date(value);
        }
        return value;
    });
}
