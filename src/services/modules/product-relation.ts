import request from '../request';
import type { GetProductListRes } from './product';

export interface ProductRelationUuidRes {
  relatedUuids: string[];
}

export interface ProductRelationSetReq {
  relatedUuids: string[];
}

export const getProductRelations = (uuid: string): Promise<GetProductListRes[]> => {
  return request({
    url: `/api/v1/admin/products/${uuid}/relations`,
  });
};

export const patchProductRelations = (
  uuid: string,
  opt: ProductRelationSetReq,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/products/${uuid}/relations`,
    method: 'PATCH',
    data: opt,
  });
};

export const getProductOtaRelationUuids = (uuid: string): Promise<ProductRelationUuidRes> => {
  return request({
    url: `/api/v1/admin/products/${uuid}/ota-relations/uuids`,
  });
};

export const getProductOtaRelations = (uuid: string): Promise<GetProductListRes[]> => {
  return request({
    url: `/api/v1/admin/products/${uuid}/ota-relations`,
  });
};

export const patchProductOtaRelations = (
  uuid: string,
  opt: ProductRelationSetReq,
): Promise<void> => {
  return request({
    url: `/api/v1/admin/products/${uuid}/ota-relations`,
    method: 'PATCH',
    data: opt,
  });
};
