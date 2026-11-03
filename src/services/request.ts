import { message } from 'antd';
import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { history } from '@umijs/max';

const deleteEmptyField = (obj: Record<string, any>) => {
  if (!obj) return;
  const empty = [null, undefined, ''];
  Object.keys(obj).forEach((key) => {
    if (empty.includes(obj[key])) {
      delete obj[key];
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any) => {
        if (item && item.constructor === Object) {
          deleteEmptyField(item);
        }
      });
    } else if (obj[key] && obj[key].constructor === Object) {
      deleteEmptyField(obj[key]);
    }
  });
};

interface Response<T = any> {
  code: number;
  desc: string;
  data: T;
}

axios.defaults.timeout = 30000;

axios.interceptors.request.use(reqSuccess, reqError);
axios.interceptors.response.use(resSuccess, resError);

function reqSuccess(config: AxiosRequestConfig) {
  const newConfig = { ...config };
  newConfig.headers!.token = localStorage.getItem('token') ?? '';
  if (config.method && ['get', 'delete'].includes(config.method)) {
    deleteEmptyField(newConfig.params as Record<string, any>);
  } else if (config.method === 'post') {
    deleteEmptyField(newConfig.data as Record<string, any>);
  }
  return newConfig;
}

function reqError(error: Error) {
  return Promise.reject(error);
}

function resSuccess(res: AxiosResponse<Response>) {
  const { data } = res;
  // 与 v1 约定一致：业务码非 0 视为失败（登录接口本身也返回统一结构）
  if (data.code) {
    message.warning(data.desc);
    const error = {
      ...new Error(data.desc),
      config: res.config,
      response: res,
    } as AxiosError<Response>;
    return Promise.reject(error);
  }
  return data.data;
}

function resError(error: AxiosError<Response>) {
  if (error.response) {
    const { status } = error.response;
    if (status === 401) {
      message.error('登录超时，请登录');
      localStorage.removeItem('token');
      history.push('/login');
    } else if (String(status)[0] === '5') {
      message.error('服务器内部错误，请联系管理员');
    } else if (status === 400) {
      message.error('请求错误，请联系管理员');
    }
  } else {
    message.error('网络异常，请检查网络');
  }
  return Promise.reject(error);
}

export default function request<T = any>(
  param: AxiosRequestConfig,
): Promise<T> {
  return axios.request<any, T>(param);
}
