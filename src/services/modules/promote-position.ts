import request from '../request';

export interface GetPromotePositionRes {
  uuid: string;
  title: string;
  code: string;
  desc: string;
}
export const getPromotePositionAll = (): Promise<GetPromotePositionRes[]> => {
  return request({
    url: '/api/v1/admin/promote-positions/all',
  });
};

export interface PostPromotePositionReq {
  title: string;
  code: string;
  desc: string;
}
export const postPromotePosition = (opt: PostPromotePositionReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/promote-positions',
    method: 'POST',
    data: opt,
  });
};

export type PatchPromotePositionReq = Partial<PostPromotePositionReq>;
export const patchPromotePosition = (opt: PatchPromotePositionReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/promote-positions/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deletePromotePosition = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/promote-positions/${uuid}`,
    method: 'DELETE',
  });
};
