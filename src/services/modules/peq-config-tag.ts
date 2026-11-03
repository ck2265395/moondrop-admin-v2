import request from '../request';

export interface GetPeqConfigTagAllReq {
  peqConfigUuid: string;
}
export interface GetPeqConfigTagAllRes {
  uuid: string;
  name: string;
}
export const getPeqConfigTagAll = (
  params: GetPeqConfigTagAllReq,
): Promise<GetPeqConfigTagAllRes[]> => {
  return request({
    url: '/api/v1/peq-config-tags/all',
    params,
  });
};

export interface PostPeqConfigTagReq {
  peqConfigUuid: string;
  peqConfigTags: {
    name: string;
  }[];
}
export const postPeqConfigTag = (opt: PostPeqConfigTagReq): Promise<void> => {
  return request({
    url: '/api/v1/peq-config-tags',
    method: 'POST',
    data: opt,
  });
};

// v2 接口：获取启用的标签列表
export interface GetPeqConfigTagListRes {
  title: string;
  type: string;
  icon: string;
}

export const getPeqConfigTagList = (): Promise<GetPeqConfigTagListRes[]> => {
  return request({
    url: '/api/v2/peq-config-tags/list',
  });
};
