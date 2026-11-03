import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface QaItem {
  uuid?: string;
  question: string;
  answer: string;
  questionEn?: string;
  answerEn?: string;
  questionJp?: string;
  answerJp?: string;
  questionKr?: string;
  answerKr?: string;
  questionTw?: string;
  answerTw?: string;
}

export interface GetQaCategoryReq extends PageFilter {
  title?: string;
}

export interface GetQaCategoryRes {
  uuid: string;
  title: string;
  titleEn?: string;
  titleJp?: string;
  titleKr?: string;
  titleTw?: string;
}

export interface PostQaCategoryReq {
  title: string;
  titleEn?: string;
  titleJp?: string;
  titleKr?: string;
  titleTw?: string;
}

export interface GetQaCategoryConfigRes {
  qaItems: QaItem[];
}

export interface PostQaCategoryConfigReq {
  qaItems: QaItem[];
}

export const getQaCategoryAll = (
  params?: GetQaCategoryReq,
): Promise<PageResult<GetQaCategoryRes>> => {
  return request({
    url: '/api/v1/admin/qa-categories/all',
    params,
  });
};

export const postQaCategory = (opt: PostQaCategoryReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/qa-categories',
    method: 'POST',
    data: opt,
  });
};

export type PatchQaCategoryReq = Partial<PostQaCategoryReq>;
export const patchQaCategory = (opt: PatchQaCategoryReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/qa-categories/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteQaCategory = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/qa-categories/${uuid}`,
    method: 'DELETE',
  });
};

export const getQaCategoryConfig = (uuid: string): Promise<GetQaCategoryConfigRes> => {
  return request({
    url: `/api/v1/admin/qa-categories/${uuid}/qa-config`,
  });
};

export const postQaCategoryConfig = (
  uuid: string,
  opt: PostQaCategoryConfigReq,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/qa-categories/${uuid}/qa-config`,
    method: 'POST',
    data: opt,
  });
};
