import request from '../request';

export interface PostAdminLoginReq {
  username: string;
  password: string;
}

export interface PostAdminLoginRes {
  token: string;
}

export const postAdminLogin = (opt: PostAdminLoginReq): Promise<PostAdminLoginRes> => {
  return request({
    url: '/api/v1/admins/login',
    method: 'POST',
    data: opt,
  });
};

export const postAdminLogout = (): Promise<void> => {
  return request({
    url: '/api/v1/admins/logout',
    method: 'POST',
  });
};

export interface GetAdminMineRes {
  uuid: string;
  status: 0 | 1;
  username: string;
  name: string;
  mobile: string;
  job: string;
  casdoorUsername: string | null;
  casdoorEmail: string | null;
  casdoorAvatar: string | null;
  casdoorRoles: string | null;
  createTime: string;
  updateTime: string;
}

export const getAdminMine = (): Promise<GetAdminMineRes> => {
  return request({
    url: '/api/v1/admins/mine',
  });
};
