import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

// list
export interface GetMicrophoneAdjustReq extends PageFilter {
  uuid?: string;
  productUuid?: string;
  file?: string;
  snCode?: string;
}
export interface GetMicrophoneAdjustRes {
  uuid: string;
  productUuid: string;
  file: string;
  snCode: string;
  product?: {
    model: string;
    name?: string;
  };
}

export const getMicrophoneAdjustAll = (
  params: GetMicrophoneAdjustReq,
): Promise<PageResult<GetMicrophoneAdjustRes>> => {
  return request({
    url: '/api/v1/admin/microphoneadjust/all',
    params,
  });
};

// post-add
export interface PostMicrophoneAdjustReq {
  productUuid: string;
  file: string;
  snCode: string;
}

export const postMicrophoneAdjust = (opt: PostMicrophoneAdjustReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/microphoneadjust',
    method: 'POST',
    data: opt,
  });
};

export type patchMicrophoneAdjustReq = Partial<PostMicrophoneAdjustReq>;
export const patchMicrophoneAdjust = (
  opt: patchMicrophoneAdjustReq,
  uuid: string,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/microphoneadjust/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteMicrophoneAdjust = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/microphoneadjust/${uuid}`,
    method: 'DELETE',
  });
};
