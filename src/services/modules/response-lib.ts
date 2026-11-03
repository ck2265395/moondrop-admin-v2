import request from '../request';

export interface GetResponseLibRes {
  uuid: string;
  name: string;
  file: string;
  tags: string[];
}

export interface PostResponseLibReq {
  name: string;
  file: string;
}

export const getResponseLibAll = (): Promise<GetResponseLibRes[]> => {
  return request({
    url: '/api/v1/admin/responselib/all',
  });
};

export const postResponseLib = (opt: PostResponseLibReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/responselib',
    method: 'POST',
    data: opt,
  });
};

export type PatchResponseLibReq = Partial<PostResponseLibReq>;
export const patchResponseLib = (opt: PatchResponseLibReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/responselib/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteResponseLib = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/responselib/${uuid}`,
    method: 'DELETE',
  });
};
