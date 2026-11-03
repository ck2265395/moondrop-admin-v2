import type { PageFilter } from '@/interfaces/PageFilter';
import type { PageResult } from '@/interfaces/PageResult';
import request from '../request';

export interface GetFeedbackRes {
  uuid: string;
  content: string;
  publishTime: number;
  username?: string;
  productUuid?: string;
  product?: {
    uuid: string;
    model: string;
    name: string;
  };
  appversion?: string;
  devicemodel?: string;
  status?: string;
  tag?: string;
  userUuid?: string;
  user?: {
    username: string;
    profilepic: string;
  };
  otaversion?: string;
  phoneinfo?: string;
  snLeft?: string;
  snRight?: string;
  problemType?: string;
  file?: string;
  reply?: string;
  replyTime?: number;
}

export interface GetStatisticsDto {
  startTime?: string;
  endTime?: string;
  keyword?: string;
  product_uuid?: string;
  otaversion?: string;
  appversion?: string;
  problem_type?: string;
  data_type?: number;
  latitude?: string;
}

export enum Latitude {
  TREND = 'Trend',
  ISSUE = 'Issue',
  PRODUCT = 'Product',
  PRODUCT_HEATMAP = 'ProductHeatmap',
  VERSION_TRACKING = 'VersionTracking',
  DEVICE_COMPATIBILITY = 'DeviceCompatibility',
  KEYWORD = 'Keyword',
  USER_DATA = 'UserData',
}

export enum TimeRangeType {
  ALL = 'all',
  DAY_3 = '3d',
  MONTH_1 = '1m',
  MONTH_3 = '3m',
  CUSTOM = 'custom',
}

export const ProblemType = {
  CONNECTIVITY: 'connectivity',
  CRASH: 'crash',
  AUDIO: 'audio',
  OTA: 'ota',
  DUAL_DEVICE: 'dual_device',
  TOUCH_CONTROL: 'touch_control',
  DSP: 'dsp',
  AI_TUNING: 'ai_tuning',
  BATTERY: 'battery',
  ACCOUNT: 'account',
  UI_UX: 'ui_ux',
  FEATURE_REQUEST: 'feature_request',
  OTHER: 'other',
};

export const ProblemTypeLabel = {
  [ProblemType.CONNECTIVITY]: '连接/配对/蓝牙',
  [ProblemType.CRASH]: '崩溃/卡死/无响应',
  [ProblemType.AUDIO]: '声音/音频/麦克风',
  [ProblemType.OTA]: '固件/升级/OTA',
  [ProblemType.DUAL_DEVICE]: '双设备连接',
  [ProblemType.TOUCH_CONTROL]: '触控设置',
  [ProblemType.DSP]: '在线交互DSP',
  [ProblemType.AI_TUNING]: 'AI调音助手',
  [ProblemType.BATTERY]: '充电/电量',
  [ProblemType.ACCOUNT]: '账号/登录/注册',
  [ProblemType.UI_UX]: '界面/交互',
  [ProblemType.FEATURE_REQUEST]: '功能建议',
  [ProblemType.OTHER]: '其他',
};
export const ProblemTypes = [
  { value: 'connectivity', label: '连接/配对/蓝牙' },
  { value: 'crash', label: '崩溃/卡死/无响应' },
  { value: 'audio', label: '声音/音频/麦克风' },
  { value: 'ota', label: '固件/升级/OTA' },
  { value: 'dual_device', label: '双设备连接' },
  { value: 'touch_control', label: '触控设置' },
  { value: 'dsp', label: '在线交互DSP' },
  { value: 'ai_tuning', label: 'AI调音助手' },
  { value: 'battery', label: '充电/电量' },
  { value: 'account', label: '账号/登录/注册' },
  { value: 'ui_ux', label: '界面/交互' },
  { value: 'feature_request', label: '功能建议' },
  { value: 'other', label: '其他' },
];

export interface GetStatisticsRes {
  cnt: number;
  brand?: string;
  phone_model?: string;
  product_name?: string;
  product_uuid?: string;
  problemType?: string;
  publishDay?: Date;
}
export interface VersionTracking {
  cnt: number;
  problemType?: string;
  version?: string;
}
export interface StatisticsVersionRes {
  app: VersionTracking[];
  ota: VersionTracking[];
}
export interface StatisticsKeywordRes {
  text: string;
  value: number;
}
export interface GetFeedbackReq extends PageFilter {
  title?: string;
  keyword?: string;
  product_uuid?: string;
  otaversion?: string;
  problem_type?: string;
  startTime?: string;
  endTime?: string;
  appversion?: string;
  status?: string;
}
export const getFeedbackAll = (params?: GetFeedbackReq): Promise<PageResult<GetFeedbackRes>> => {
  return request({
    url: '/api/v1/admin/user-feedbacks/all',
    params,
  });
};

export const patchFeedbackReply = (uuid: string, reply: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/user-feedbacks/${uuid}/reply`,
    method: 'PATCH',
    data: { reply },
  });
};

export const patchFeedbackProblemType = (uuid: string, problemType: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/user-feedbacks/${uuid}/problem-type`,
    method: 'PATCH',
    data: { problemType },
  });
};

export const deleteFeedback = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/user-feedbacks/${uuid}`,
    method: 'DELETE',
  });
};

export const getAllAppVersion = () => {
  return request({
    url: `/api/v1/admin/user-feedbacks/appversions`,
    method: 'GET',
  });
};

export const getStatistics = (params: GetStatisticsDto): Promise<GetStatisticsRes[]> => {
  return request({
    url: `/api/v1/admin/user-feedbacks/statistics`,
    method: 'GET',
    params,
  });
};
export const getStsVersion = (params: GetStatisticsDto): Promise<StatisticsVersionRes> => {
  return request({
    url: `/api/v1/admin/user-feedbacks/statistics`,
    method: 'GET',
    params,
  });
};
export const getStsKeywords = (params: GetStatisticsDto): Promise<StatisticsKeywordRes[]> => {
  return request({
    url: `/api/v1/admin/user-feedbacks/statistics`,
    method: 'GET',
    params,
  });
};

// ===== 自动打标 =====
export interface AutoTagPreviewItem {
  uuid: string;
  content: string;
  predictedType: string;
}
export interface AutoTagPreviewRes {
  total: number;
  tagged: Record<string, number>;
  other: number;
  list: AutoTagPreviewItem[];
}
export interface AutoTagApplyItem {
  uuid: string;
  problemType: string;
}
export interface AutoTagApplyRes {
  updated: number;
  skipped: number;
  tagged: Record<string, number>;
}

export const autoTagPreview = (limit?: number): Promise<AutoTagPreviewRes> => {
  return request({
    url: '/api/v1/admin/user-feedbacks/auto-tag/preview',
    method: 'GET',
    params: limit ? { limit } : undefined,
  });
};

// items: 用户在前端可覆盖预测类型，按选择直接回写
export const autoTagApply = (items: AutoTagApplyItem[]): Promise<AutoTagApplyRes> => {
  return request({
    url: '/api/v1/admin/user-feedbacks/auto-tag/apply',
    method: 'POST',
    data: { items },
  });
};
