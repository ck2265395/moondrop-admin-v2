import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetOperationLogReq extends PageFilter {
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
