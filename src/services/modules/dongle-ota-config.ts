import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetDongleOtaConfigIndexReq extends PageFilter {
  productUuid?: string;
  status?: string;
  name?: string;
}

export interface GetDongleOtaConfigIndexRes {
  uuid: string;
  productUuid: string;
  product?: {
    uuid: string;
    model: string;
    name: string;
  };
  name: string;
  version: string;
  file: string;
  desc: string;
  desc_enUS: string;
  desc_jaJP: string;
  desc_koKR: string;
  status: 0 | 1;
  createTime: number;
  updateTime: number;
}

export const getDongleOtaConfigIndex = (
  params?: GetDongleOtaConfigIndexReq,
): Promise<PageResult<GetDongleOtaConfigIndexRes>> => {
  return request({
    url: '/api/v1/admin/dongle-ota-configs',
    params,
  });
};

export interface PostDongleOtaConfigReq {
  status: 0 | 1;
  productUuid: string;
  name: string;
  version: string;
  file: string;
  desc?: string;
  desc_enUS?: string;
  desc_jaJP?: string;
  desc_koKR?: string;
}

export const postDongleOtaConfig = (opt: PostDongleOtaConfigReq): Promise<{ uuid: string }> => {
  return request({
    url: '/api/v1/admin/dongle-ota-configs',
    method: 'POST',
    data: opt,
  });
};

export type PatchDongleOtaConfigReq = Partial<PostDongleOtaConfigReq>;
export const patchDongleOtaConfig = (opt: PatchDongleOtaConfigReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/dongle-ota-configs/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const duplicateDongleOtaConfig = (uuid: string): Promise<{ uuid: string }> => {
  return request({
    url: `/api/v1/admin/dongle-ota-configs/${uuid}/duplicate`,
    method: 'POST',
  });
};

export const deleteDongleOtaConfig = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/dongle-ota-configs/${uuid}`,
    method: 'DELETE',
  });
};
