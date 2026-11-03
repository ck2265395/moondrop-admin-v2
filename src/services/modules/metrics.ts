import request from '../request';

export interface ApiRedItem {
  method: string;
  name: string;
  /** 当天调用次数 */
  count: number;
  /** 当天 5xx 错误次数 */
  errors: number;
  /** 当天慢请求次数（>=1s） */
  slowCount: number;
  /** 近 10 分钟平均耗时（毫秒），近 10 分钟无调用为 null */
  avgLatencyMs: number | null;
  /** 当天错误率（%） */
  errorRate: number;
}

export interface GetApiRedRes {
  date: string;
  total: number;
  totalErrors: number;
  totalSlow: number;
  items: ApiRedItem[];
}

export interface GetSystemInfoRes {
  hostname: string;
  platform: string;
  nodeVersion: string;
  /** 进程运行秒数 */
  uptime: number;
  cpu: {
    model: string;
    cores: number;
    /** 1/5/15 分钟负载 */
    loadavg: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    /** 进程 RSS 内存 */
    processRss: number;
  };
  disk: {
    path: string;
    total: number;
    free: number;
    used: number;
  };
  redis: {
    ok: boolean;
    latencyMs?: number;
    version?: string;
    usedMemory?: number;
    usedMemoryPeak?: number;
    connectedClients?: number;
    opsPerSec?: number;
    keys?: number;
    uptime?: number;
  };
  pg: {
    ok: boolean;
    latencyMs?: number;
    version?: string;
    activeConnections?: number;
    idleConnections?: number;
    maxConnections?: number;
    dbSize?: number;
    cacheHitRatio?: number;
    uptime?: number;
  };
}

/** 当天接口 RED 面板（调用量/错误/慢请求/耗时/并发） */
export const getMetricsApiRed = (): Promise<GetApiRedRes> =>
  request({
    method: 'GET',
    url: '/api/v1/admin/metrics/api-red',
  });

/** 部署环境系统信息 */
export const getMetricsSystemInfo = (): Promise<GetSystemInfoRes> =>
  request({
    method: 'GET',
    url: '/api/v1/admin/metrics/system-info',
  });
