import request from '../request';
import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';

export interface PostAdminLoginReq {
  username: string;
  password: string;
}

export interface PostAdminLoginRes {
  token: string;
}

export const postAdminLogin = (opt: PostAdminLoginReq): Promise<PostAdminLoginRes> => {
  return request({
    url: '/api/v1/admins/login',
    method: 'POST',
    data: opt,
  });
};

export const postAdminLogout = (): Promise<void> => {
  return request({
    url: '/api/v1/admins/logout',
    method: 'POST',
  });
};

export interface PostAdminCasdoorLoginReq {
  code: string;
}
export interface PostAdminCasdoorLoginRes {
  token: string;
}
export const postAdminCasdoorLogin = (opt: PostAdminCasdoorLoginReq): Promise<PostAdminCasdoorLoginRes> => {
  return request({
    url: '/api/v1/admins/casdoor/login',
    method: 'POST',
    data: opt,
  });
};

export interface GetAdminMineRes {
  uuid: string;
  status: 0 | 1;
  username: string;
  name: string;
  mobile: string;
  job: string;
  casdoorUsername: string | null;
  casdoorEmail: string | null;
  casdoorAvatar: string | null;
  casdoorRoles: string | null;
  createTime: string;
  updateTime: string;
}

export const getAdminMine = (): Promise<GetAdminMineRes> => {
  return request({
    url: '/api/v1/admins/mine',
  });
};

type GetAdminReq = PageFilter;
export interface GetAdminRes {
  uuid: string;
  username: string;
  name: string;
  job: string;
  mobile: string;
  casdoorUsername: string | null;
  casdoorEmail: string | null;
  casdoorAvatar: string | null;
  casdoorRoles: string | null;
  status: number;
  updateTime: number;
  createTime: number;
}
export const getAdmin = (opt?: GetAdminReq): Promise<PageResult<GetAdminRes>> => {
  return request({
    url: '/api/v1/admins',
    params: opt,
  });
};

export interface PostAdminReq {
  name: string;
  job: string;
  mobile: string;
  username: string;
  password: string;
  status: number;
  casdoorUsername?: string;
}
export const postAdmin = (opt: PostAdminReq): Promise<void> => {
  return request({
    url: '/api/v1/admins',
    method: 'POST',
    data: opt,
  });
};

// 后端 PATCH 支持可选 password（admin.service.ts 中 if (body.password) 分支），仅 username 不可改
export type PatchAdminReq = Partial<Omit<PostAdminReq, 'username'>>;
export const patchAdmin = (opt: PatchAdminReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admins/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};
