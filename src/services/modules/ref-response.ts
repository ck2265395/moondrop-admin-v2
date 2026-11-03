import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export enum RefType {
  OFFICIAL = 'OFFICIAL',
  STAR = 'STAR',
  USER = 'USER',
}

export interface GetRefResponseReq extends PageFilter {
  name?: string;
  tagName?: string;
  userUuid?: string;
  type?: RefType;
}

export interface GetRefResponseRes {
  uuid: string;
  name: string;
  file: string;
  tags: string[];
  userUuid: string;
  status: boolean;
  type: RefType;
}

export interface PostRefResponseReq {
  name: string;
  file: string;
  tags?: string[];
  userUuid?: string;
  status?: boolean;
  type?: RefType;
}

export const getRefResponseAll = (
  params?: GetRefResponseReq,
): Promise<PageResult<GetRefResponseRes>> => {
  return request({
    url: '/api/v1/admin/refresponse/all',
    params,
  });
};

export const postRefResponse = (opt: PostRefResponseReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/refresponse',
    method: 'POST',
    data: opt,
  });
};

export type PatchRefResponseReq = Partial<PostRefResponseReq>;
export const patchRefResponse = (opt: PatchRefResponseReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/refresponse/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteRefResponse = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/refresponse/${uuid}`,
    method: 'DELETE',
  });
};
