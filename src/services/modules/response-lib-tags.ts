import request from '../request';

export interface GetResponseLibTagsAllReq {
  responseLibUuid: string;
}

export interface GetResponseLibTagsAllRes {
  uuid: string;
  name: string;
}

export interface PostResponseLibTagsReq {
  responseLibUuid: string;
  responseLibTags: {
    name: string;
  }[];
}

export const getResponseLibTagsAll = (
  params: GetResponseLibTagsAllReq,
): Promise<GetResponseLibTagsAllRes[]> => {
  return request({
    url: '/api/v1/admin/response-lib-tags/all',
    params,
  });
};

export const postResponseLibTags = (opt: PostResponseLibTagsReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/response-lib-tags',
    method: 'POST',
    data: opt,
  });
};
