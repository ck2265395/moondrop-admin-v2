import request from '../request';

interface PostFileRes {
  key: string;
}

export interface PostFileDirectUploadPolicyReq {
  fileName: string;
  mimeType?: string;
}

export interface PostFileDirectUploadPolicyRes {
  uploadUrl: string;
  uploadToken: string;
  key: string;
  expiresIn: number;
}

export const postFileDirectUploadPolicy = (
  group: string,
  opt: PostFileDirectUploadPolicyReq,
): Promise<PostFileDirectUploadPolicyRes> => {
  return request({
    url: `/api/v1/admin/file/${group}/upload/policy`,
    method: 'POST',
    data: opt,
  });
};

export const postFile = (
  group: string,
  opt: FormData,
  onUploadProgress?: (e: any) => void,
): Promise<PostFileRes> => {
  return request({
    url: `/api/v1/admin/file/${group}`,
    method: 'POST',
    data: opt,
    onUploadProgress,
    timeout: 5 * 60000,
  });
};
