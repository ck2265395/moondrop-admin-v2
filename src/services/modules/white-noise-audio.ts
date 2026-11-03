import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export enum WhiteNoiseAudioType {
  MATERIAL = 'material',
  OFFICIAL = 'official',
  USER = 'user',
}

export interface GetWhiteNoiseAudioReq extends PageFilter {
  uuid?: string;
  title?: string;
  type?: WhiteNoiseAudioType;
  status?: number;
}

export interface GetWhiteNoiseAudioRes {
  uuid: string;
  title: string;
  titleEnUS: string;
  titleJaJP: string;
  titleKoKR: string;
  desc: string;
  descEnUS: string;
  descJaJP: string;
  descKoKR: string;
  mixinfo?: string;
  file: string;
  pic?: string;
  type: WhiteNoiseAudioType;
  status: number;
  tags: string[];
  iconUuid?: string;
}

export interface PostWhiteNoiseAudioReq {
  title: string;
  titleEnUS?: string;
  titleJaJP?: string;
  titleKoKR?: string;
  desc?: string;
  descEnUS?: string;
  descJaJP?: string;
  descKoKR?: string;
  mixinfo?: string;
  file: string;
  pic?: string;
  type: WhiteNoiseAudioType;
  tags?: string[];
  iconUuid?: string;
  status?: number;
}

export const getWhiteNoiseAudioIndex = (
  params?: GetWhiteNoiseAudioReq,
): Promise<PageResult<GetWhiteNoiseAudioRes>> => {
  return request({
    url: '/api/v1/admin/white-noise-audios/index',
    params,
  });
};

export const getWhiteNoiseAudioAll = (): Promise<GetWhiteNoiseAudioRes[]> => {
  return request({
    url: '/api/v1/admin/white-noise-audios/all',
  });
};

export const postWhiteNoiseAudio = (opt: PostWhiteNoiseAudioReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/white-noise-audios',
    method: 'POST',
    data: opt,
  });
};

export type PatchWhiteNoiseAudioReq = Partial<PostWhiteNoiseAudioReq>;
export const patchWhiteNoiseAudio = (opt: PatchWhiteNoiseAudioReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/white-noise-audios/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteWhiteNoiseAudio = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/white-noise-audios/${uuid}`,
    method: 'DELETE',
  });
};
