import request from '../request';

export interface GetGlobalConfigUniqueRes {
  nonMainlandUserAfterSalesDesc: string;
  nonMainlandUserAfterSalesDesc_enUS: string;
}

export const getGlobalConfigUnique = (): Promise<GetGlobalConfigUniqueRes> => {
  return request({
    url: '/api/v1/admin/global-configs/unique',
  });
};

export interface PatchGlobalConfigUniqueReq {
  nonMainlandUserAfterSalesDesc: string;
  nonMainlandUserAfterSalesDesc_enUS: string;
}
export const patchGlobalConfigUnique = (opt: PatchGlobalConfigUniqueReq): Promise<void> => {
  return request({
    url: `/api/v1/admin/global-configs/unique`,
    method: 'PATCH',
    data: opt,
  });
};
