import type { PageResult } from '@/interfaces/PageResult';
import type { OtaConfigType } from '@/utils/data';
import request from '../request';

export interface GetOtaConfigAllReq {
  uuid?: string;
  productUuid?: string;
  status?: string;
  name?: string;
}

export interface GetOtaConfigAllRes {
  uuid: string;
  productUuid: string;
  parentUuid: string;
  product: {
    model: string;
    name: string;
  };
  type: OtaConfigType;
  name: string;
  file: string;
  separatedFiles?: {
    sku: number;
    name: string;
    promptToneIndex: number;
    file: string;
  }[];
  isSeparatedVersion?: boolean;
  status: 0 | 1;
  version: string;
  desc: string;
  desc_enUS: string;
  desc_jaJP: string;
  desc_koKR: string;
  appResourceUuids: string[];
  createTime: number;
  updateTime: number;
}
export const getOtaConfigAll = (params: GetOtaConfigAllReq): Promise<GetOtaConfigAllRes[]> => {
  return request({
    url: '/api/v1/admin/ota-configs/all',
    params,
  });
};

// 专用分页接口，返回 {total, list}；用于 OTA 配置列表页
export const getOtaConfigPage = (
  params?: GetOtaConfigAllReq & { pageIndex?: number; pageSize?: number },
): Promise<PageResult<GetOtaConfigAllRes>> => {
  return request({
    url: '/api/v1/admin/ota-configs',
    params,
  });
};

export interface PostOtaConfigReq {
  status: 0 | 1;
  name: string;
  productUuid?: string;
  parentUuid?: string;
  type: OtaConfigType;
  file?: string;
  separatedFiles?: {
    sku: number;
    name: string;
    promptToneIndex: number;
    file: string;
  }[];
  isSeparatedVersion?: boolean;
  version?: string;
  desc: string;
  desc_enUS: string;
  desc_jaJP: string;
  desc_koKR: string;
  appResourceUuids: string[];
}
export const postOtaConfig = (opt: PostOtaConfigReq): Promise<{ uuid: string }> => {
  return request({
    url: '/api/v1/admin/ota-configs',
    method: 'POST',
    data: opt,
  });
};

export const duplicateOtaConfig = (uuid: string): Promise<{ uuid: string; count: number }> => {
  return request({
    url: `/api/v1/admin/ota-configs/${uuid}/duplicate`,
    method: 'POST',
  });
};

export type PatchOtaConfigReq = Partial<PostOtaConfigReq>;
export const patchOtaConfig = (opt: PatchOtaConfigReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/ota-configs/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteOtaConfig = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/ota-configs/${uuid}`,
    method: 'DELETE',
  });
};
