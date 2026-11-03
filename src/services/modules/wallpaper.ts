import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetWallpaperRes {
  uuid: string;
  title: string;
  img: string;
  desc: string;
  createTime: number;
}

export interface GetWallpaperPageReq {
  title?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const getWallpaperPage = (
  params?: GetWallpaperPageReq,
): Promise<PageResult<GetWallpaperRes>> => {
  return request({
    url: '/api/v1/admin/wallpapers',
    params,
  });
};

export interface PostWallpaperReq {
  title: string;
  img: string;
  desc: string;
}
export const postWallpaper = (opt: PostWallpaperReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/wallpapers',
    method: 'POST',
    data: opt,
  });
};

export type PatchWallpaperReq = Partial<PostWallpaperReq>;
export const patchWallpaper = (opt: PatchWallpaperReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/wallpapers/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteWallpaper = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/wallpapers/${uuid}`,
    method: 'DELETE',
  });
};
