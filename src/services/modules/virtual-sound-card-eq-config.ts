import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetVscEqConfigAllReq extends PageFilter {
  keyword?: string;
  channelUuid?: string;
  userUuid?: string;
  type?: string;
  status?: number;
}

export interface GetVscEqConfigRes {
  uuid: string;
  title: string;
  file: string;
  desc?: string;
  channelUuid: string;
  userUuid?: string | null;
  userNickname?: string;
  userUsername?: string;
  source?: string;
  type: string;
  status: number;
  like: number;
  favorite: number;
  downloadcount: number;
  commentCount: number;
  createTime: number;
  updateTime: number;
  tags?: { uuid: string; title: string; icon: string }[];
}

export const getVscEqConfigAll = (
  params: GetVscEqConfigAllReq,
): Promise<PageResult<GetVscEqConfigRes>> => {
  return request({
    url: '/api/v2/admin/virtual-sound-card-eq-config/all',
    params,
  });
};

export interface PostVscEqConfigReq {
  title: string;
  file: string;
  desc?: string;
  channelUuid: string;
  userUuid?: string;
  source?: string;
  type?: string;
  status?: number;
  tagUuids?: string[];
}

export const postVscEqConfig = (opt: PostVscEqConfigReq): Promise<string> => {
  return request({
    url: '/api/v2/admin/virtual-sound-card-eq-config',
    method: 'POST',
    data: opt,
  });
};

export type PatchVscEqConfigReq = Partial<PostVscEqConfigReq>;

export const patchVscEqConfig = (opt: PatchVscEqConfigReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/virtual-sound-card-eq-config/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

/** 状态切换（上线/下线） */
export const patchVscEqConfigStatus = (status: number, uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/virtual-sound-card-eq-config/${uuid}`,
    method: 'PATCH',
    data: { status },
  });
};

export const deleteVscEqConfig = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/virtual-sound-card-eq-config/${uuid}`,
    method: 'DELETE',
  });
};
