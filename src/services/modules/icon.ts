import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetIconReq extends PageFilter {
  uuid?: string;
  name?: string;
}

export interface GetIconRes {
  uuid: string;
  name: string;
  file: string;
}

export interface PostIconReq {
  name: string;
  file: string;
}

export const getIconIndex = (params?: GetIconReq): Promise<PageResult<GetIconRes>> => {
  return request({
    url: '/api/v1/admin/icons/index',
    params,
  });
};

export const getIconAll = (): Promise<GetIconRes[]> => {
  return request({
    url: '/api/v1/admin/icons/all',
  });
};

export const postIcon = (opt: PostIconReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/icons',
    method: 'POST',
    data: opt,
  });
};

export type PatchIconReq = Partial<PostIconReq>;
export const patchIcon = (opt: PatchIconReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/icons/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteIcon = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/icons/${uuid}`,
    method: 'DELETE',
  });
};
