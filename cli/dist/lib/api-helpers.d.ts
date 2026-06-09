import { Ora } from 'ora';
/**
 * API 调用辅助函数 - 统一处理 spinner、错误和 JSON 输出
 */
export declare function apiCall<T = unknown>(message: string, fetchFn: () => Promise<T>, options?: {
    json?: boolean;
    onSuccess?: (data: T, spinner: Ora) => void;
}): Promise<T>;
/**
 * 快捷函数：带查询参数的 GET 请求
 */
export declare function apiGet<T = unknown>(endpoint: string, params: Record<string, string>, message: string, options?: {
    json?: boolean;
    onSuccess?: (data: T, spinner: Ora) => void;
}): Promise<T>;
/**
 * 快捷函数：POST 请求
 */
export declare function apiPost<T = unknown>(endpoint: string, body: unknown, message: string, options?: {
    json?: boolean;
    onSuccess?: (data: T, spinner: Ora) => void;
}): Promise<T>;
/**
 * 报表专用函数 - 处理需要参数验证的报表查询
 */
export declare function apiReport<T = unknown>(endpoint: string, params: Record<string, string>, message: string, requiredParams: string[], options?: {
    json?: boolean;
    onSuccess?: (data: T) => void;
}): Promise<T>;
