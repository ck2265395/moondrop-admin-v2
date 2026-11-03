import request from '../request';

export interface GetAppResourceRes {
  uuid: string;
  name: string;
  parentUuid: string;
  uri?: string;
  dictDesc?: string;
  usageCount?: number;
}

export interface GetAppResourceOtaConfigsRes {
  uuid: string;
  productModel?: string;
  productName?: string;
  name: string;
  version: string;
  appResourceNames: string[];
}

export interface GetAppResourceProductUsageRes {
  uuid: string;
  model: string;
  type: string;
}

export interface PostAppResourceReq {
  name: string;
  parentUuid: string;
  uri: string;
}

export interface PatchAppResourceReq {
  name: string;
  uri: string;
}

export const getAppResourceAll = (params: { rootUuid: string }): Promise<GetAppResourceRes[]> => {
  return request({
    url: '/api/v1/admin/app-resources/all',
    params,
  });
};

export const getAppResourceAllList = (): Promise<GetAppResourceRes[]> => {
  return request({
    url: '/api/v1/admin/app-resources/all-list',
  });
};

export const getAppResourceAllRoot = (): Promise<GetAppResourceRes[]> => {
  return request({
    url: '/api/v1/admin/app-resources/all-root',
  });
};

export const getAppResourceOtaConfigs = (uuid: string): Promise<GetAppResourceOtaConfigsRes[]> => {
  return request({
    url: `/api/v1/admin/app-resources/${uuid}/ota-configs`,
  });
};

export const getAppResourceProducts = (uuid: string): Promise<GetAppResourceProductUsageRes[]> => {
  return request({
    url: `/api/v1/admin/app-resources/${uuid}/products`,
  });
};

export const postAppResource = (data: PostAppResourceReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/app-resources',
    method: 'POST',
    data,
  });
};

export const patchAppResource = (uuid: string, data: PatchAppResourceReq): Promise<void> => {
  return request({
    url: `/api/v1/admin/app-resources/${uuid}`,
    method: 'PATCH',
    data,
  });
};
