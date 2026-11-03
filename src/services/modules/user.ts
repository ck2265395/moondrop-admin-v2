import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

type GetUserReq = PageFilter & {
  uuid?: string;
  username?: string;
  email?: string;
  phone?: string;
};
export interface GetUserRes {
  uuid: string;
  username: string;
  email: string;
  phone?: string | null;
  status: number;
  profilepic?: string;
  updateTime: number;
  createTime: number;
  ip?: string;
  region?: string;
  latestLoginTime?: number;
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
};
export const patchUser = (opt: PatchUserReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/users/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteUser = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/users/${uuid}`,
    method: 'DELETE',
  });
};
