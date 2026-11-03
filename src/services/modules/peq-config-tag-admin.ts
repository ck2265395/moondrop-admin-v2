import request from '../request';

export enum TagType {
  GAME = 'game',
  MUSIC = 'music',
  MOVIE = 'movie',
}

export const TagTypeLabel: Record<string, string> = {
  [TagType.GAME]: '游戏',
  [TagType.MUSIC]: '音乐',
  [TagType.MOVIE]: '电影',
};

export interface GetPeqConfigTagAdminAllReq {
  title?: string;
  type?: TagType;
  status?: 0 | 1;
}

export interface GetPeqConfigTagAdminAllRes {
  uuid: string;
  title: string;
  title_enUS: string;
  title_jaJP: string;
  title_koKR: string;
  type: string;
  status: 0 | 1;
  icon: string;
  sortOrder: number;
  createTime: number;
  updateTime: number;
}

export interface PostPeqConfigTagAdminReq {
  title: string;
  title_enUS: string;
  title_jaJP: string;
  title_koKR: string;
  type: TagType;
  status?: 0 | 1;
  icon: string;
  sortOrder?: number;
}

export type PatchPeqConfigTagAdminReq = Partial<PostPeqConfigTagAdminReq>;

export interface GetPeqConfigTagAdminTypeListRes {
  key: string;
  value: string;
  value_zhTW: string;
  value_enUS: string;
  value_jaJP: string;
  value_koKR: string;
}

export interface GetPeqConfigTagAdminListRes {
  uuid: string;
  title: string;
  type: string;
  icon: string;
  sortOrder: number;
}

export const getPeqConfigTagAdminList = (): Promise<GetPeqConfigTagAdminListRes[]> => {
  return request({
    url: '/api/v1/admin/peq-config-tags-new/list',
  });
};

export const getPeqConfigTagAdminTypeList = (): Promise<GetPeqConfigTagAdminTypeListRes[]> => {
  return request({
    url: '/api/v1/admin/peq-config-tags-new/typelist',
  });
};

export const getPeqConfigTagAdminAll = (
  params?: GetPeqConfigTagAdminAllReq,
): Promise<GetPeqConfigTagAdminAllRes[]> => {
  return request({
    url: '/api/v1/admin/peq-config-tags-new/all',
    params,
  });
};

export const postPeqConfigTagAdmin = (opt: PostPeqConfigTagAdminReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/peq-config-tags-new',
    method: 'POST',
    data: opt,
  });
};

export const patchPeqConfigTagAdmin = (
  opt: PatchPeqConfigTagAdminReq,
  uuid: string,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/peq-config-tags-new/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deletePeqConfigTagAdmin = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/peq-config-tags-new/${uuid}`,
    method: 'DELETE',
  });
};
