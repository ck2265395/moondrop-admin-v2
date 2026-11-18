import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetLoginLogReq extends PageFilter {
  /** 登录用户名（模糊） */
  username?: string;
  /** 是否成功 */
  success?: 'true' | 'false';
  startTime?: number;
  endTime?: number;
}

export interface GetLoginLogRes {
  uuid: string;
  username: string;
  adminUuid?: string | null;
  /** 按 adminUuid 关联的管理员姓名，已删除或未注册时为空 */
  adminName?: string;
  loginType: 'password' | 'casdoor';
  success: boolean;
  failReason: string;
  ip: string;
  region: string;
  createTime: number;
}

/** 管理员登录日志列表（成功+失败） */
export const getLoginLogs = (params?: GetLoginLogReq): Promise<PageResult<GetLoginLogRes>> =>
  request({
    url: '/api/v1/admin/login-logs',
    params,
  });
