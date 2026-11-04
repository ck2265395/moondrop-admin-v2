import request from '../request';

/** 系统配置值类型：boolean 渲染 Switch，number 渲染数字输入，string 渲染文本输入，image 渲染图片上传 */
export type SystemConfigType = 'boolean' | 'number' | 'string' | 'image';

export interface GetSystemConfigIndexRes {
  /** 配置项标识（如 peer_sync.enabled） */
  key: string;
  /** 配置分组标识 */
  groupKey: string;
  /** 配置分组名称 */
  groupLabel: string;
  /** 配置项名称 */
  label: string;
  /** 配置项说明 */
  description: string;
  type: SystemConfigType;
  value: string;
  sort: number;
  createTime: number;
  updateTime: number;
}

/** 配置项列表 */
export const getSystemConfigIndex = (): Promise<GetSystemConfigIndexRes[]> =>
  request({
    url: '/api/v1/admin/system-configs',
  });

/** 修改配置值 */
export const patchSystemConfig = (key: string, value: string): Promise<void> =>
  request({
    url: `/api/v1/admin/system-configs/${key}`,
    method: 'PATCH',
    data: { value },
  });

/**
 * 皮肤/背景公开配置（无需鉴权，供登录页/Dashboard/Layout 读取背景图 URL）
 * 返回 Record<configKey, value>，空值代表用默认样式
 * @deprecated 请使用 getPublicConfig()
 */
export const getSkinConfig = (): Promise<Record<string, string>> =>
  request({
    url: '/api/v1/system-configs/skin',
  });

/**
 * 公开配置（site + footer + skin），一次返回所有无需鉴权的品牌与视觉配置
 * 供 Layout / 登录页 / 底部版权 / favicon 等动态读取
 */
export const getPublicConfig = (): Promise<Record<string, string>> =>
  request({
    url: '/api/v1/system-configs/public',
  });
