import request from '../request';

export interface GetFreqResponseAdminAllReq {
  title?: string;
  type?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface GetFreqResponseAdminAllRes {
  uuid: string;
  title: string;
  file: string;
  type: string;
  userUuid: string;
  createTime: number;
  updateTime: number;
}

export interface PostFreqResponseAdminReq {
  title: string;
  file: string;
  type?: string;
  userUuid?: string;
}

export type PatchFreqResponseAdminReq = Partial<PostFreqResponseAdminReq>;

export const getFreqResponseAdminAll = (
  params?: GetFreqResponseAdminAllReq,
): Promise<{ list: GetFreqResponseAdminAllRes[]; total: number }> => {
  return request({
    url: '/api/v1/admin/freq-response/all',
    params,
  });
};

export const postFreqResponseAdmin = (opt: PostFreqResponseAdminReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/freq-response',
    method: 'POST',
    data: opt,
  });
};

export const patchFreqResponseAdmin = (
  opt: PatchFreqResponseAdminReq,
  uuid: string,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/freq-response/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteFreqResponseAdmin = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/freq-response/${uuid}`,
    method: 'DELETE',
  });
};
