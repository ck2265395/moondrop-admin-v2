import request from '../request';

export interface ProductSyncFieldDiff {
  key: string;
  label: string;
  local: string;
  peer: string;
}

export interface ProductSyncRelationItem {
  uuid: string;
  model: string;
  name: string;
  peerExists: boolean;
  /** 对端是否存在该关联行（产品存在但关联行缺失时推送补写） */
  peerRelationExists: boolean;
  /** 推送时跳过该条关联的原因，不跳过则为空 */
  skipReason?: string;
}

export interface ProductSyncOtaConfigItem {
  uuid: string;
  name: string;
  version: string;
  /** missing-对端不存在（推送时写入）；exists-对端已存在（跳过，不覆盖） */
  peerStatus: 'missing' | 'exists';
  fieldDiffs: ProductSyncFieldDiff[];
}

export interface ProductSyncAppResourceItem {
  uuid: string;
  name: string;
  uri: string;
  /** exists-对端同uuid已存在；missing-对端缺失（推送时自动同步，uuid一致）；conflict-对端同名但uuid不一致（推送时由管理员选择关联对端资源或跳过） */
  peerStatus: 'exists' | 'missing' | 'conflict';
  /** conflict 时对端资源uuid */
  peerUuid?: string;
  /** conflict 时对端资源名称 */
  peerName?: string;
  /** conflict 时对端资源的父链名称（自根到直接父节点，供人工比对挂载路径） */
  peerAncestorNames?: string[];
  /** missing 时对端缺失的父链祖先节点（推送时自动补齐） */
  missingAncestors?: { uuid: string; name: string }[];
  /** missing 时资源在本端的完整父链名称（自芯片根到直接父节点） */
  ancestorNames?: string[];
}

export interface ProductSyncCompareItem {
  uuid: string;
  model: string;
  name: string;
  peerStatus: 'missing' | 'exists' | 'model_conflict';
  modelConflictUuid?: string;
  productFieldDiffs: ProductSyncFieldDiff[];
  chip: {
    status: 'match' | 'missing' | 'diff' | 'name_conflict';
    localName: string;
    peerName: string;
    missingAncestors: { uuid: string; name: string }[];
    /** name_conflict 时对端同名但uuid不同的芯片节点（产品跳过同步） */
    nameConflicts: { name: string; peerUuid: string }[];
  };
  sku: {
    localCount: number;
    codes: string[];
  };
  productRelations: ProductSyncRelationItem[];
  otaRelations: ProductSyncRelationItem[];
  otaConfigs: ProductSyncOtaConfigItem[];
  dongleConfigs: ProductSyncOtaConfigItem[];
  appResources: ProductSyncAppResourceItem[];
  canSync: boolean;
  warnings: string[];
}

export interface PostProductSyncCompareReq {
  uuids: string[];
}

export interface PostProductSyncCompareRes {
  peerConfigured: boolean;
  /** 对端平台名称（PEER_NAME） */
  peerName: string;
  items: ProductSyncCompareItem[];
}

export interface GetProductSyncStatusRes {
  /** 是否启用推送（env 对端库配置齐全 且 系统配置 peer_sync.enabled 开启） */
  enabled: boolean;
  /** 对端平台名称（PEER_NAME） */
  name: string;
}

export interface PostProductSyncPushReq extends PostProductSyncCompareReq {
  /** 冲突APP资源中选择「关联对端资源」的本端资源uuid列表；缺省一律跳过关联 */
  usePeerResourceUuids?: string[];
}

export interface PostProductSyncPushRes {
  pushed: number;
  pushedOtaConfigs: number;
  pushedDongleConfigs: number;
  skippedRelations: number;
  /** 跳过的OTA功能配置关联条数（对端存在同名资源但uuid不一致且未选择关联对端资源） */
  skippedOtaResources: number;
  /** 采用对端同名资源写入的功能配置关联条数 */
  relatedPeerResources: number;
  /** 未推送的产品（型号+原因） */
  skippedProducts: string[];
}

/** 查询推送能力状态（是否启用 + 对端平台名称） */
export const getProductSyncStatus = (): Promise<GetProductSyncStatusRes> =>
  request({
    method: 'GET',
    url: '/api/v1/admin/products-sync/status',
  });

/** 与对端数据库对比勾选的产品数据 */
export const postProductSyncCompare = (
  data: PostProductSyncCompareReq,
): Promise<PostProductSyncCompareRes> =>
  request({
    method: 'POST',
    url: '/api/v1/admin/products-sync/compare',
    data,
  });

/** 推送勾选的产品数据到对端数据库（含冲突资源关联选择） */
export const postProductSyncPush = (
  data: PostProductSyncPushReq,
): Promise<PostProductSyncPushRes> =>
  request({
    method: 'POST',
    url: '/api/v1/admin/products-sync/push',
    data,
  });
