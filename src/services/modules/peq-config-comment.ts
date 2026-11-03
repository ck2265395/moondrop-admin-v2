import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetPeqConfigCommentAllReq extends PageFilter {
  /** 不传则查询全部评论（按时间倒序分页） */
  peqConfigUuid?: string;
}

export interface GetPeqConfigCommentAllRes {
  uuid: string;
  comment: string;
  createTime: number;
  score?: number;
  profilepic?: string;
  nickname?: string;
  status: boolean;
  userUuid?: string;
}

export interface PostPeqConfigCommentReq {
  peqConfigUuid: string;
  peqConfigComments: {
    comment: string;
    userUuid?: string;
    score?: number;
    profilepic?: string;
    nickname?: string;
    status?: boolean;
  }[];
}

export type PatchPeqConfigCommentReq = Partial<
  PostPeqConfigCommentReq['peqConfigComments'][number]
>;

export const getPeqConfigCommentAll = (
  params: GetPeqConfigCommentAllReq,
): Promise<PageResult<GetPeqConfigCommentAllRes>> => {
  return request({
    url: '/api/v1/admin/peq-config-comments/all',
    params,
  });
};

export const postPeqConfigComment = (opt: PostPeqConfigCommentReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/peq-config-comments',
    method: 'POST',
    data: opt,
  });
};

export const patchPeqConfigComment = (
  opt: PatchPeqConfigCommentReq,
  uuid: string,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/peq-config-comments/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deletePeqConfigComment = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/peq-config-comments/${uuid}`,
    method: 'DELETE',
  });
};
