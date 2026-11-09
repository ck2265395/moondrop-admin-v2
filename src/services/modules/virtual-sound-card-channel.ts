import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetVscChannelReq extends PageFilter {
  channelKey?: string;
  status?: number;
  keyword?: string;
}

export interface GetVscChannelRes {
  uuid: string;
  channelKey: string;
  name: string;
  nameEnUS: string;
  nameJaJP: string;
  nameKoKR: string;
  status: number;
  sort: number;
  remark: string;
  createTime: number;
  updateTime: number;
}

export const getVscChannelAll = (
  params: GetVscChannelReq,
): Promise<PageResult<GetVscChannelRes>> => {
  return request({
    url: '/api/v2/admin/virtual-sound-card-channel/all',
    params,
  });
};

export interface PostVscChannelReq {
  channelKey: string;
  name: string;
  nameEnUS?: string;
  nameJaJP?: string;
  nameKoKR?: string;
  status?: number;
  sort?: number;
  remark?: string;
}

export const postVscChannel = (opt: PostVscChannelReq): Promise<void> => {
  return request({
    url: '/api/v2/admin/virtual-sound-card-channel',
    method: 'POST',
    data: opt,
  });
};

export type PatchVscChannelReq = Partial<PostVscChannelReq>;

export const patchVscChannel = (opt: PatchVscChannelReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/virtual-sound-card-channel/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};
