import enumeration from '@/utils/enumeration';

export const NULL_UUID = '00000000-0000-0000-0000-000000000000';

export enum OtaConfigType {
  CATEGORY = 'CATEGORY',
  CONFIG = 'CONFIG',
}

export enum DeviceType {
  USB = 'USB',
  BT = 'BT',
  WIRED = 'WIRED',
}

export enum PeqType {
  OFFICIAL = 'OFFICIAL',
  USER = 'USER',
  STAR = 'STAR',
  PRIVATE = 'PRIVATE',
}

export const otaConfigType = enumeration<OtaConfigType>(OtaConfigType, {
  [OtaConfigType.CATEGORY]: '分类',
  [OtaConfigType.CONFIG]: '配置项',
});

export const deviceType = enumeration<DeviceType>(DeviceType, {
  [DeviceType.USB]: 'USB',
  [DeviceType.BT]: '蓝牙',
  [DeviceType.WIRED]: '有线',
});

export const peqType = enumeration<PeqType>(PeqType, {
  [PeqType.OFFICIAL]: '官方',
  [PeqType.USER]: '用户配置',
  [PeqType.STAR]: '精选',
  [PeqType.PRIVATE]: '私有',
});

export enum PromoteType {
  Linking = 'Linking',
}

export const promoteType = enumeration<PromoteType>(PromoteType, {
  [PromoteType.Linking]: '外部网页打开',
});
