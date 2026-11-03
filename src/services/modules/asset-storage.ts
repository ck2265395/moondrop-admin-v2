import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetAssetStorageReq extends PageFilter {
  key?: string;
  description?: string;
}

export interface GetAssetStorageRes {
  uuid: string;
  key: string;
  description: string;
  fileKey: string;
  fileSize: number;
  allowDel: boolean;
  createTime: number;
  updateTime: number;
}

export interface PostAssetStorageReq {
  key: string;
  description?: string;
  fileKey: string;
}

export interface PatchAssetStorageReq {
  key?: string;
  description?: string;
  fileKey?: string;
}

export const getAssetStorageIndex = (
  params?: GetAssetStorageReq,
): Promise<PageResult<GetAssetStorageRes>> => {
  return request({
    url: '/api/v1/admin/asset-storage/all',
    params,
  });
};

export const postAssetStorage = (opt: PostAssetStorageReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/asset-storage/',
    method: 'POST',
    data: opt,
  });
};

export const patchAssetStorage = (opt: PatchAssetStorageReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/asset-storage/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteAssetStorage = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/asset-storage/${uuid}`,
    method: 'DELETE',
  });
};
