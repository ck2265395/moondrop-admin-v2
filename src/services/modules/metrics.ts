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

// ========== Dashboard Overview ==========

export interface DashboardUserStats {
  total: number
  todayNew: number
  yesterdayNew: number
  last7DaysNew: number
  last30DaysNew: number
  registrationTrend: { date: string; count: number }[]
}

export interface DashboardFeedbackBrief {
  uuid: string
  content: string
  status: string
  username: string
  productUuid: string | null
  productName: string | null
  publishTime: number
  reply: string
}

export interface DashboardOperationLogBrief {
  uuid: string
  adminUsername: string
  module: string
  action: string
  summary: string
  createTime: string
}

export interface DashboardApiToday {
  total: number
  totalErrors: number
  totalSlow: number
}

export interface DashboardOverview {
  user: DashboardUserStats
  productTotal: number
  peqConfigTotal: number
  feedback: {
    total: number
    pendingCount: number
    recent: DashboardFeedbackBrief[]
  }
  operationLog: {
    recent: DashboardOperationLogBrief[]
  }
  apiToday: DashboardApiToday
}

/** 工作台概览（聚合：用户/产品/PEQ配置/反馈/操作日志/API 健康） */
export const getMetricsOverview = (): Promise<DashboardOverview> =>
  request({
    method: 'GET',
    url: '/api/v1/admin/metrics/overview',
  });
