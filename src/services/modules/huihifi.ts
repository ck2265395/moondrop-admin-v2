import request from '../request';

export interface GetHuiHifiStatusRes {
  enabled: boolean;
}

export interface GetHuiHifiEvaluationsReq {
  pageSize?: number;
  keyword?: string;
  category?: 'EARBUDS' | 'SOUND_SOURCE';
  orderBy?: string;
  direction?: 'ASC' | 'DESC';
  lastKey?: string;
  lastId?: string;
}

export interface GetHuiHifiEvaluationsRes {
  items: any[];
  nextCursor?: {
    lastKey?: string;
    lastId?: string;
  };
  total?: number;
}

export const getHuiHifiStatus = (): Promise<GetHuiHifiStatusRes> => {
  return request({
    url: '/api/v1/admin/huihifi/status',
  });
};

export const getHuiHifiEvaluations = (
  params?: GetHuiHifiEvaluationsReq,
): Promise<GetHuiHifiEvaluationsRes> => {
  return request({
    url: '/api/v1/admin/huihifi/evaluations',
    params,
  });
};

export const postHuiHifiCacheInvalidate = (): Promise<{ removed: number }> => {
  return request({
    url: '/api/v1/admin/huihifi/cache/invalidate',
    method: 'POST',
  });
};
