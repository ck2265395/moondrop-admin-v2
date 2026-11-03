import request from '../request';

export interface GetHeadphoneModelAdminAllReq {
  title?: string;
}

export interface GetHeadphoneModelAdminAllRes {
  uuid: string;
  title: string;
  createTime: number;
  updateTime: number;
}

export interface PostHeadphoneModelAdminReq {
  title: string;
}

export type PatchHeadphoneModelAdminReq = Partial<PostHeadphoneModelAdminReq>;

export const getHeadphoneModelAdminAll = (
  params?: GetHeadphoneModelAdminAllReq,
): Promise<GetHeadphoneModelAdminAllRes[]> => {
  return request({
    url: '/api/v1/admin/headphone-models/all',
    params,
  });
};

export const postHeadphoneModelAdmin = (opt: PostHeadphoneModelAdminReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/headphone-models',
    method: 'POST',
    data: opt,
  });
};

export const patchHeadphoneModelAdmin = (
  opt: PatchHeadphoneModelAdminReq,
  uuid: string,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/headphone-models/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteHeadphoneModelAdmin = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/headphone-models/${uuid}`,
    method: 'DELETE',
  });
};
