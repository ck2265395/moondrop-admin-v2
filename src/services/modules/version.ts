import request from '../request';

export interface VersionCommit {
  hash: string;
  subject: string;
  date: string;
}

export interface VersionRes {
  version: string;
  hash: string;
  branch: string;
  buildTime: string;
  env: string;
  commits: VersionCommit[];
}

export const getVersion = (): Promise<VersionRes> => {
  return request({
    url: '/api/v1/version',
  });
};

export interface VersionCompareItem {
  version?: string;
  hash?: string;
  branch?: string;
  buildTime?: string;
  env?: string;
  commitMsg?: string;
  commits?: VersionCommit[];
}

export interface VersionCompareRes {
  current: VersionCompareItem;
  test?: VersionCompareItem;
  prod?: VersionCompareItem;
  error?: string;
}

export const getVersionCompare = (
  testUrl?: string,
  prodUrl?: string,
): Promise<VersionCompareRes> => {
  return request({
    url: '/api/v1/version/compare',
    params: { testUrl, prodUrl },
  });
};
