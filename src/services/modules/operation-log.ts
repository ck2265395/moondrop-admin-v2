import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetOperationLogReq extends PageFilter {
  /** 管理员 uuid（精确匹配） */
  adminUuid?: string;
  /** 管理员用户名（模糊，兼容旧参数） */
  adminUsername?: string;
  module?: string;
  action?: string;
  summary?: string;
  startTime?: number;
  endTime?: number;
}

export interface GetOperationLogRes {
  uuid: string;
  adminUuid?: string;
  adminUsername: string;
  /** 按 adminUuid 关联的管理员姓名，已删除时回退快照用户名 */
  adminName?: string;
  ip: string;
  region?: string;
  module: string;
  action: string;
  summary: string;
  createTime: number;
}

export const getOperationLogs = (
  params?: GetOperationLogReq,
): Promise<PageResult<GetOperationLogRes>> => {
  return request({
    url: '/api/v1/admin/operation-logs',
    params,
  });
};

export const getOperationLogModules = (): Promise<string[]> => {
  return request({
    url: '/api/v1/admin/operation-logs/modules',
  });
};

export interface OperationLogAdmin {
  uuid: string;
  /** 管理员姓名（无姓名时回退用户名） */
  name: string;
}

export const getOperationLogAdmins = (): Promise<OperationLogAdmin[]> => {
  return request({
    url: '/api/v1/admin/operation-logs/admins',
  });
};
