import type { PageResult } from '@/interfaces/PageResult';
import type { DeviceType } from '@/utils/data';
import request from '../request';

export interface GetProductListReq {
  uuid?: string;
  model?: string;
  name?: string;
  type?: DeviceType;
  appResourceRootUuid?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface ProductSkuItem {
  uuid?: string;
  sku: string;
  isDefault?: boolean;
  bannerImg?: string;
  bannerImgNight?: string;
  squareBannerImg?: string;
  squareBannerImgNight?: string;
  bannerImgV2?: string;
  hubDetailImg?: string;
  bannerImgT?: string;
  bannerImgNightT?: string;
  bannerImgLT?: string;
  bannerImgRT?: string;
  bannerImgNightLT?: string;
  bannerImgNightRT?: string;
}

export interface GetProductListRes {
  uuid: string;
  model: string;
  name: string;
  type: DeviceType;
  manual: string;
  manual_enUS: string;
  manual_jaJP: string;
  manual_koKR: string;
  appResourceRootUuid: string;
  appResourceRoot: {
    name: string;
  };
  bannerImg: string;
  bannerImgNight: string;
  squareBannerImg: string;
  squareBannerImgNight: string;
  bannerImgV2: string;
  hubDetailImg: string;
  bannerImgT: string;
  bannerImgNightT: string;
  bannerImgLT: string;
  bannerImgRT: string;
  bannerImgNightLT: string;
  bannerImgNightRT: string;
  sellpic: string;
  targetlink: string;
  hasotaconfig: boolean;
  istws: boolean;
  isSpeaker: boolean;
  freqResponse: string;
  languageType?: string;
  eqBands: number;
  gainRange: string;
  qRange: string;
  isTotalGainSupported: boolean;
  isPreGainSupported: boolean;
  supportedFilterTypes: string;
  isDisplay: number;
  isGamingHeadphone: boolean;
  isDacAmp: boolean;
  isDongleUpgradable: boolean;
  dongleUpgradeTypes?: string[];
  createTime: number;
  updateTime: number;
  variants?: ProductSkuItem[];
}
export const getProductAll = (params?: GetProductListReq): Promise<GetProductListRes[]> => {
  return request({
    url: '/api/v1/admin/products/all',
    params,
  });
};

// 专用分页接口，返回 {total, list}；用于产品列表页
export const getProductPage = (
  params?: GetProductListReq,
): Promise<PageResult<GetProductListRes>> => {
  return request({
    url: '/api/v1/admin/products',
    params,
  });
};

export interface PostProductReq {
  model: string;
  name: string;
  manual?: string;
  type?: DeviceType;
  manual_enUS?: string;
  manual_jaJP?: string;
  manual_koKR?: string;
  appResourceRootUuid: string;
  bannerImg?: string;
  bannerImgNight?: string;
  squareBannerImg?: string;
  squareBannerImgNight?: string;
  bannerImgV2?: string;
  hubDetailImg?: string;
  bannerImgT?: string;
  bannerImgNightT?: string;
  bannerImgLT?: string;
  bannerImgRT?: string;
  bannerImgNightLT?: string;
  bannerImgNightRT?: string;
  sellpic?: string;
  targetlink?: string;
  hasotaconfig?: boolean;
  istws?: boolean;
  isSpeaker?: boolean;
  freqResponse?: string;
  languageType?: string;
  eqBands?: number;
  gainRange?: string;
  qRange?: string;
  isTotalGainSupported?: boolean;
  isPreGainSupported?: boolean;
  supportedFilterTypes?: string;
  isDisplay?: number;
  isGamingHeadphone?: boolean;
  isDacAmp?: boolean;
  isDongleUpgradable?: boolean;
  dongleUpgradeTypes?: string[];
  variants?: ProductSkuItem[];
}
export const postProduct = (opt: PostProductReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/products',
    method: 'POST',
    data: opt,
  });
};

export type PatchProductReq = Partial<PostProductReq>;
export const patchProduct = (opt: PatchProductReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/products/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteProduct = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/products/${uuid}`,
    method: 'DELETE',
  });
};

export interface MigrateSkuRes {
  total: number;
  migrated: number;
  skipped: number;
}

export const migrateProductSku = (): Promise<MigrateSkuRes> => {
  return request({
    url: '/api/v1/admin/products/migrate-sku',
    method: 'POST',
  });
};
