import request from '../request';

export interface GetOtaConfigVoiceAllReq {
  otaConfigUuid: string;
}

export interface GetOtaConfigVoiceAllRes {
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

export interface OtaConfigVoiceItem {
  name: string;
  name_enUS: string;
  name_jaJP: string;
  name_koKR: string;
  desc: string;
  desc_enUS: string;
  desc_jaJP: string;
  desc_koKR: string;
}

export interface PostOtaConfigVoiceReq {
  otaConfigUuid: string;
  otaConfigVoices: OtaConfigVoiceItem[];
}

export const getOtaConfigVoiceAll = (
  params: GetOtaConfigVoiceAllReq,
): Promise<GetOtaConfigVoiceAllRes[]> => {
  return request({
    url: '/api/v1/admin/ota-config-voices/all',
    params,
  });
};

export const postOtaConfigVoice = (opt: PostOtaConfigVoiceReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/ota-config-voices',
    method: 'POST',
    data: opt,
  });
};
