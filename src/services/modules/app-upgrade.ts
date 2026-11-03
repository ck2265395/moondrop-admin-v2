import request from '../request';

export enum AppPlatform {
  WINDOWS = 'windows',
  MAC = 'mac',
  ANDROID = 'android',
}

export enum AppRegion {
  DOMESTIC = 'domestic',
  OVERSEAS = 'overseas',
}

export interface GetAppUpgradeAllReq {
  platform?: AppPlatform;
  region?: AppRegion;
  status?: 0 | 1;
}

export interface GetAppUpgradeAllRes {
  uuid: string;
  version: string;
  platform: AppPlatform;
  region: AppRegion;
  downloadUrl: string;
  forceUpdate: 0 | 1;
  releaseNotes: string;
  releaseNotes_enUS: string;
  releaseNotes_jaJP: string;
  releaseNotes_koKR: string;
  fileSize: number;
  fileMd5: string;
  status: 0 | 1;
  createTime: number;
  updateTime: number;
  downloadCountByCheck: number;
  downloadCountByLatest: number;
}

export interface PostAppUpgradeReq {
  version: string;
  platform: AppPlatform;
  region?: AppRegion;
  downloadUrl: string;
  forceUpdate?: 0 | 1;
  releaseNotes?: string;
  releaseNotes_enUS?: string;
  releaseNotes_jaJP?: string;
  releaseNotes_koKR?: string;
  fileSize?: number;
  fileMd5?: string;
  status?: 0 | 1;
}

export interface PostAppUpgradeUploadPolicyReq {
  fileName: string;
  mimeType?: string;
}

export interface PostAppUpgradeUploadPolicyRes {
  uploadUrl: string;
  uploadToken: string;
  key: string;
  expiresIn: number;
}

export interface PostAppUpgradeUploadCompleteReq {
  key: string;
  fileMd5?: string;
}

export interface PostAppUpgradeUploadCompleteRes {
  key: string;
  fileSize: number;
  fileMd5: string;
}

export const getAppUpgradeAll = (params?: GetAppUpgradeAllReq): Promise<GetAppUpgradeAllRes[]> => {
  return request({
    url: '/api/v1/admin/app-upgrade/all',
    params,
  });
};

export const postAppUpgrade = (opt: PostAppUpgradeReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/app-upgrade',
    method: 'POST',
    data: opt,
  });
};

export type PatchAppUpgradeReq = Partial<PostAppUpgradeReq>;
export const patchAppUpgrade = (opt: PatchAppUpgradeReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/app-upgrade/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteAppUpgrade = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/app-upgrade/${uuid}`,
    method: 'DELETE',
  });
};

export const postAppUpgradeUploadPolicy = (
  opt: PostAppUpgradeUploadPolicyReq,
): Promise<PostAppUpgradeUploadPolicyRes> => {
  return request({
    url: '/api/v1/admin/app-upgrade/upload/policy',
    method: 'POST',
    data: opt,
  });
};

export const postAppUpgradeUploadComplete = (
  opt: PostAppUpgradeUploadCompleteReq,
): Promise<PostAppUpgradeUploadCompleteRes> => {
  return request({
    url: '/api/v1/admin/app-upgrade/upload/complete',
    method: 'POST',
    data: opt,
  });
};
