import request from '../request';

export interface GetProtocolV2Res {
  uuid: string;
  version: string;
  privatepolicy: string;
  userpolicy: string;
  privatepolicy_en: string;
  userpolicy_en: string;
  privatepolicy_jp: string;
  userpolicy_jp: string;
  privatepolicy_kr: string;
  userpolicy_kr: string;
}

export type PostProtocolV2Req = Omit<GetProtocolV2Res, 'uuid'>;

export const getProtocolV2All = (): Promise<GetProtocolV2Res[]> => {
  return request({
    url: '/api/v2/admin/protocolv2/all',
  });
};

export const postProtocolV2 = (opt: PostProtocolV2Req): Promise<void> => {
  return request({
    url: '/api/v2/admin/protocolv2',
    method: 'POST',
    data: opt,
  });
};

export type PatchProtocolV2Req = Partial<PostProtocolV2Req>;
export const patchProtocolV2 = (opt: PatchProtocolV2Req, uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/protocolv2/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteProtocolV2 = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v2/admin/protocolv2/${uuid}`,
    method: 'DELETE',
  });
};
