import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import type { PeqType } from '@/utils/data';
import request from '../request';

export interface GetPeqConfigAllReq extends PageFilter {
  productUuid?: string;
  status?: string;
  title?: string;
  keyword?: string;
  username?: string;
  type?: PeqType;
  tagUuid?: string;
}

export interface GetPeqConfigRes {
  uuid: string;
  title: string;
  file: string;
  desc: string;
  like: number;
  dislike: number;
  status: 0 | 1;
  type: PeqType;
  productUuid: string;
  product: {
    model: string;
    name: string;
    isDacAmp: boolean;
  };
  headphoneModelUuid?: string;
  headphoneModel?: {
    uuid: string;
    title: string;
  };
  tagUuids?: string[];
  tags?: {
    uuid: string;
    title: string;
    type: string;
  }[];
  userUuid: string;
  username: string;
  favorite: number;
  downloadcount: number;
  comment_count?: number;
  source?: string;
  createTime?: number;
  independentChannelTuning?: boolean;
}

export const getPeqConfigAll = (
  params: GetPeqConfigAllReq,
): Promise<PageResult<GetPeqConfigRes>> => {
  return request({
    url: '/api/v1/admin/peq-configs/all',
    params,
  });
};

export interface PostPeqConfigReq {
  title: string;
  file: string;
  desc: string;
  like: number;
  dislike: number;
  status: number;
  type: PeqType;
  productUuid: string;
  headphoneModelUuid?: string;
  tagUuids?: string[];
  independentChannelTuning?: boolean;
}
export const postPeqConfig = (opt: PostPeqConfigReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/peq-configs',
    method: 'POST',
    data: opt,
  });
};

export type PatchPeqConfigReq = Partial<PostPeqConfigReq>;
export const patchPeqConfig = (opt: PatchPeqConfigReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/peq-configs/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deletePeqConfig = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/peq-configs/${uuid}`,
    method: 'DELETE',
  });
};
