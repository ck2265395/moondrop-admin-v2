import request from '../request';
import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';

export interface AdminCaptcha {
  captchaId: string;
  /** 用户输入的验证码字符（不区分大小写） */
  code: string;
}

export interface PostAdminLoginReq {
  username: string;
  password: string;
  /** 后台关闭图形验证码时可不传 */
  captcha?: AdminCaptcha;
}

export interface PostAdminLoginRes {
  token: string;
}

export interface GetAdminCaptchaRes {
  /** 是否开启图形验证码，关闭时 captchaId/svg 为空 */
  enabled: boolean;
  captchaId: string;
  /** 验证码 SVG 文本 */
  svg: string;
}

export const getAdminCaptcha = (): Promise<GetAdminCaptchaRes> => {
  return request({
    url: '/api/v1/admins/captcha',
  });
};

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

export const ADMIN_PENDING_APPROVAL = 9504;
export const ADMIN_AUDIT_REJECTED = 9505;

export interface GetAdminMineRes {
  uuid: string;
  status: 0 | 1 | 2 | 3;
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

type GetAdminReq = PageFilter & {
  status?: number;
};
export interface GetAdminRes {
  uuid: string;
  username: string;
  name: string;
  job: string;
  mobile: string;
  casdoorUsername: string | null;
  casdoorOrg: string;
  casdoorEmail: string | null;
  casdoorAvatar: string | null;
  casdoorRoles: string | null;
  company: string;
  department: string;
  auditRemark: string;
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
  company?: string;
  department?: string;
  /** 头像地址（完整 URL，含域名） */
  casdoorAvatar?: string;
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

export interface AdminAuditReq {
  /** 1：通过，3：驳回 */
  status: 1 | 3;
  /** 驳回原因，驳回时必填 */
  remark?: string;
}
export const patchAdminAudit = (opt: AdminAuditReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admins/${uuid}/audit`,
    method: 'PATCH',
    data: opt,
  });
};
