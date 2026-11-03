import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetAppResourceDictAdminPageReq {
  name?: string;
  desc?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface AppResourceDictItem {
  uuid: string;
  name: string;
  desc: string;
  createTime: number;
  updateTime: number;
}

export interface PostAppResourceDictReq {
  name: string;
  desc: string;
}

export type PatchAppResourceDictReq = Partial<PostAppResourceDictReq>;

export const getAppResourceDictAdminPage = (
  params?: GetAppResourceDictAdminPageReq,
): Promise<PageResult<AppResourceDictItem>> => {
  return request({
    url: '/api/v1/admin/app-resource-dicts',
    params,
  });
};

export const postAppResourceDict = (opt: PostAppResourceDictReq): Promise<{ uuid: string }> => {
  return request({
    url: '/api/v1/admin/app-resource-dicts',
    method: 'POST',
    data: opt,
  });
};

export const patchAppResourceDict = (opt: PatchAppResourceDictReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/app-resource-dicts/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteAppResourceDict = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/app-resource-dicts/${uuid}`,
    method: 'DELETE',
  });
};
