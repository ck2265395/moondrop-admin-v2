import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

type GetUserReq = PageFilter & {
  uuid?: string;
  username?: string;
  email?: string;
  phone?: string;
  permissions?: string;
};
export interface GetUserRes {
  uuid: string;
  username: string;
  nickname?: string;
  email: string;
  phone?: string | null;
  status: number;
  profilepic?: string;
  updateTime: number;
  createTime: number;
  ip?: string;
  region?: string;
  latestLoginTime?: number;
  permissions?: string[];
}

export interface UserRegistrationTrendPoint {
  date: string;
  count: number;
}

export interface UserStatisticsRes {
  total: number;
  todayNew: number;
  yesterdayNew: number;
  last7DaysNew: number;
  last30DaysNew: number;
  registrationTrend: UserRegistrationTrendPoint[];
}

export const getUserStatistics = (): Promise<UserStatisticsRes> => {
  return request({
    url: '/api/v1/admin/users/statistics',
  });
};

export const getUser = (opt?: GetUserReq): Promise<PageResult<GetUserRes>> => {
  return request({
    url: '/api/v1/admin/users',
    params: opt,
  });
};

export type PatchUserReq = {
  status?: number;
  permissions?: string[];
};
export const patchUser = (opt: PatchUserReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/users/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export interface PostAdminUserReq {
  username: string;
  email: string;
  password: string;
  phone?: string;
  status?: number;
  permissions?: string[];
}
/** 后台新建用户（免邮箱验证码，供开发测试） */
export const postAdminUser = (
  opt: PostAdminUserReq,
): Promise<{ uuid: string }> => {
  return request({
    url: '/api/v1/admin/users',
    method: 'POST',
    data: opt,
  });
};

export const getUserPermissionDict = (): Promise<Record<string, string>> => {
  return request({
    url: '/api/v1/admin/users/permission-dict',
  });
};

export const deleteUser = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/users/${uuid}`,
    method: 'DELETE',
  });
};
