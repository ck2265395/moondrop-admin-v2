import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetPromoteReq extends PageFilter {
  promotePositionUuid?: string;
}

export interface GetPromoteRes {
  uuid: string;
  title: string;
  img: string;
  type: string;
  target: string;
  desc: string;
  promotePosition?: {
    uuid: string;
    title: string;
    code: string;
  };
}
export const getPromote = (opt: GetPromoteReq): Promise<PageResult<GetPromoteRes>> => {
  return request({
    url: '/api/v1/admin/promotes',
    params: opt,
  });
};

export interface PostPromoteReq {
  title: string;
  img: string;
  type: string;
  target: string;
  desc: string;
  promotePositionUuid: string;
}
export const postPromote = (opt: PostPromoteReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/promotes',
    method: 'POST',
    data: opt,
  });
};

export type PatchPromoteReq = Partial<PostPromoteReq>;
export const patchPromote = (opt: PatchPromoteReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/promotes/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deletePromote = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/promotes/${uuid}`,
    method: 'DELETE',
  });
};
