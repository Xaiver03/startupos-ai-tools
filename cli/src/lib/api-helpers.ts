import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { apiFetch } from './api-client.js';

/**
 * API 调用辅助函数 - 统一处理 spinner、错误和 JSON 输出
 */
export async function apiCall<T = unknown>(
  message: string,
  fetchFn: () => Promise<T>,
  options?: {
    json?: boolean;
    onSuccess?: (data: T, spinner: Ora) => void;
  }
): Promise<T> {
  const spinner = ora(message).start();
  try {
    const data = await fetchFn();
    spinner.stop();

    if (options?.json) {
      console.log(JSON.stringify(data, null, 2));
      return data;
    }

    if (options?.onSuccess) {
      options.onSuccess(data, spinner);
    } else {
      spinner.succeed('Success');
    }

    return data;
  } catch (error) {
    spinner.fail('Failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * 快捷函数：带查询参数的 GET 请求
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  params: Record<string, string>,
  message: string,
  options?: {
    json?: boolean;
    onSuccess?: (data: T, spinner: Ora) => void;
  }
): Promise<T> {
  const query = new URLSearchParams(params).toString();
  return apiCall(
    message,
    () => apiFetch(`${endpoint}?${query}`) as Promise<T>,
    options
  );
}

/**
 * 快捷函数：POST 请求
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body: unknown,
  message: string,
  options?: {
    json?: boolean;
    onSuccess?: (data: T, spinner: Ora) => void;
  }
): Promise<T> {
  return apiCall(
    message,
    () => apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<T>,
    options
  );
}

/**
 * 报表专用函数 - 处理需要参数验证的报表查询
 */
export async function apiReport<T = unknown>(
  endpoint: string,
  params: Record<string, string>,
  message: string,
  requiredParams: string[],
  options?: {
    json?: boolean;
    onSuccess?: (data: T) => void;
  }
): Promise<T> {
  // 验证必填参数
  for (const param of requiredParams) {
    if (!params[param]) {
      console.error(chalk.red(`Error: --${param.replace('_', '-')} is required`));
      process.exit(1);
    }
  }

  return apiGet(endpoint, params, message, {
    json: options?.json,
    onSuccess: options?.onSuccess ? (data) => options.onSuccess!(data) : undefined,
  });
}

