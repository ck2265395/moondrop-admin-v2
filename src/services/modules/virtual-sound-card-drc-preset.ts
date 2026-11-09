import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetVscDrcPresetReq extends PageFilter {
  keyword?: string;
  userKeyword?: string;
  userUuid?: string;
  status?: number;
}

export interface GetVscDrcPresetRes {
  uuid: string;
  title: string;
  userUuid: string;
  userUsername?: string;
  userNickname?: string;
  fileKey: string;
  icon: string;
  status: number;
  createTime: number;
  updateTime: number;
}

export const getVscDrcPresetAll = (
  params: GetVscDrcPresetReq,
): Promise<PageResult<GetVscDrcPresetRes>> => {
  return request({
    url: '/api/v2/admin/virtual-sound-card-drc-preset/all',
    params,
  });
};

export interface PostVscDrcPresetReq {
  title: string;
  userUuid?: string;
  fileKey: string;
  icon?: string;
  status?: number;
}

export const postVscDrcPreset = (opt: PostVscDrcPresetReq): Promise<string> => {
  return request({
    url: '/api/v2/admin/virtual-sound-card-drc-preset',
    method: 'POST',
    data: opt,
  });
};

export type PatchVscDrcPresetReq = Partial<PostVscDrcPresetReq>;

export const patchVscDrcPreset = (opt: PatchVscDrcPresetReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/virtual-sound-card-drc-preset/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteVscDrcPreset = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/virtual-sound-card-drc-preset/${uuid}`,
    method: 'DELETE',
  });
};
