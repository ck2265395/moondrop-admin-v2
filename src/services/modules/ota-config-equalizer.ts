import request from '../request';

export interface GetOtaConfigEqualizerAllReq {
  otaConfigUuid: string;
}

export interface GetOtaConfigEqualizerAllRes {
  uuid: string;
  name: string;
  name_enUS: string;
  name_jaJP: string;
  name_koKR: string;
  desc: string;
  desc_enUS: string;
  desc_jaJP: string;
  desc_koKR: string;
}
export const getOtaConfigEqualizerAll = (
  params: GetOtaConfigEqualizerAllReq,
): Promise<GetOtaConfigEqualizerAllRes[]> => {
  return request({
    url: '/api/v1/admin/ota-config-equalizers/all',
    params,
  });
};

export interface PostOtaConfigEqualizerReq {
  otaConfigUuid: string;
  otaConfigEqualizers: {
    name: string;
    name_enUS: string;
    name_jaJP: string;
    name_koKR: string;
    desc: string;
    desc_enUS: string;
    desc_jaJP: string;
    desc_koKR: string;
  }[];
}
export const postOtaConfigEqualizer = (opt: PostOtaConfigEqualizerReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/ota-config-equalizers',
    method: 'POST',
    data: opt,
  });
};
