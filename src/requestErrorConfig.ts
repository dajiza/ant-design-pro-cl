import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message, notification } from 'antd';

const TOKEN_KEY = 'token';

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const loginPath = '/user/login';

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage } = res as any;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, data };
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      if (error.name === 'BizError') {
        const errorInfo = error.info;
        if (errorInfo) {
          const { errorMessage } = errorInfo;
          message.error(errorMessage);
        }
      } else if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          clearTokens();
          message.error('登录已过期，请重新登录');
          history.push(loginPath);
        } else if (status === 422) {
          const errors = error.response?.data?.errors;
          if (errors) {
            const firstError = Object.values(errors)[0];
            message.error(firstError as string);
          } else {
            message.error('请求参数错误');
          }
        } else {
          message.error(`请求失败: ${status}`);
        }
      } else if (error.request) {
        message.error('网络异常，请检查网络连接');
      } else {
        message.error('请求失败，请重试');
      }
    },
  },

  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],

  responseInterceptors: [
    (response) => {
      const newToken = response.headers?.authorization;
      if (newToken) {
        setToken(newToken.replace('Bearer ', ''));
      }
      return response;
    },
  ],
};
