import type { ApiRedItem } from '@/services/modules/metrics';
import { getMetricsApiRed, getMetricsSystemInfo } from '@/services/modules/metrics';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  ApiOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  HddOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Badge, Card, Col, Progress, Row, Statistic, Tag } from 'antd';
import React from 'react';

const formatBytes = (bytes: number): string => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
};

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d ? `${d}天 ` : ''}${h}小时${m}分`;
};

const percent = (used: number, total: number): number =>
  total > 0 ? Math.round((used / total) * 100) : 0;

/** 仪表盘配色：>70 橙，>85 红 */
const gaugeColor = (p: number): string => (p > 85 ? '#ff4d4f' : p > 70 ? '#fa8c16' : '#3f8600');

const METHOD_COLOR: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PATCH: 'orange',
  PUT: 'orange',
  DELETE: 'red',
};

/** 资源仪表盘卡片标题 */
const GaugeTitle: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div style={{ color: '#666', marginBottom: 12 }}>
    {icon} {text}
  </div>
);

/** 服务状态卡片（Redis / PostgreSQL） */
const ServiceCard: React.FC<{
  title: string;
  ok: boolean;
  latencyMs?: number;
  rows: { label: string; value: React.ReactNode; alert?: boolean }[];
}> = ({ title, ok, latencyMs, rows }) => (
  <Card
    title={
      <>
        <DatabaseOutlined style={{ marginRight: 8 }} />
        {title}
      </>
    }
    extra={
      ok ? (
        <Badge
          status="success"
          text={`正常${latencyMs !== undefined ? `（${latencyMs}ms）` : ''}`}
        />
      ) : (
        <Badge status="error" text="连接失败" />
      )
    }
  >
    {ok && (
      <Row gutter={[16, 12]}>
        {rows.map((row) => (
          <Col span={12} key={row.label}>
            <div style={{ color: '#999', fontSize: 12 }}>{row.label}</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: row.alert ? '#ff4d4f' : undefined,
              }}
            >
              {row.value}
            </div>
          </Col>
        ))}
      </Row>
    )}
  </Card>
);

export default () => {
  const { data: systemInfo, loading: systemLoading } = useRequest(getMetricsSystemInfo, {
    pollingInterval: 5000,
  });
  const { data: apiRed, loading: redLoading } = useRequest(getMetricsApiRed, {
    pollingInterval: 5000,
  });

  const memPercent = systemInfo ? percent(systemInfo.memory.used, systemInfo.memory.total) : 0;
  const diskPercent = systemInfo ? percent(systemInfo.disk.used, systemInfo.disk.total) : 0;
  // Linux 负载 / 核数 估算 CPU 使用率；Windows loadavg 恒为 0
  const cpuPercent = systemInfo
    ? Math.min(100, Math.round((systemInfo.cpu.loadavg[0] / systemInfo.cpu.cores) * 100))
    : 0;
  const totalErrorRate =
    apiRed && apiRed.total > 0 ? Math.round((apiRed.totalErrors / apiRed.total) * 100) : 0;

  return (
    <PageContainer title="系统信息">
      {/* 资源概览 */}
      <Card loading={systemLoading && !systemInfo} style={{ marginBottom: 16 }}>
        {systemInfo && (
          <Row gutter={24}>
            <Col span={6}>
              <GaugeTitle icon={<DashboardOutlined />} text={`CPU（${systemInfo.cpu.cores} 核）`} />
              <Progress
                type="dashboard"
                size={100}
                percent={cpuPercent}
                strokeColor={gaugeColor(cpuPercent)}
              />
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                {systemInfo.cpu.model}
                <br />
                负载（1/5/15分钟）：
                {systemInfo.cpu.loadavg.map((v) => v.toFixed(2)).join(' / ')}
              </div>
            </Col>
            <Col span={6}>
              <GaugeTitle icon={<CloudServerOutlined />} text="内存" />
              <Progress
                type="dashboard"
                size={100}
                percent={memPercent}
                strokeColor={gaugeColor(memPercent)}
              />
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                已用 {formatBytes(systemInfo.memory.used)} / 共{' '}
                {formatBytes(systemInfo.memory.total)}
              </div>
            </Col>
            <Col span={6}>
              <GaugeTitle icon={<HddOutlined />} text={`磁盘（${systemInfo.disk.path}）`} />
              <Progress
                type="dashboard"
                size={100}
                percent={diskPercent}
                strokeColor={gaugeColor(diskPercent)}
              />
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                已用 {formatBytes(systemInfo.disk.used)} / 共 {formatBytes(systemInfo.disk.total)}
              </div>
            </Col>
            <Col span={6}>
              <GaugeTitle icon={<RocketOutlined />} text="服务进程" />
              <Statistic value={formatBytes(systemInfo.memory.processRss)} suffix="RSS" />
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                {systemInfo.hostname} ｜ {systemInfo.platform}
                <br />
                Node {systemInfo.nodeVersion} ｜ 已运行 {formatUptime(systemInfo.uptime)}
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* 依赖服务健康 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <ServiceCard
            title="Redis"
            ok={systemInfo?.redis.ok ?? false}
            latencyMs={systemInfo?.redis.latencyMs}
            rows={[
              { label: '版本', value: systemInfo?.redis.version },
              {
                label: '已运行',
                value: formatUptime(systemInfo?.redis.uptime ?? 0),
              },
              {
                label: '内存（峰值）',
                value: `${formatBytes(systemInfo?.redis.usedMemory ?? 0)}（${formatBytes(
                  systemInfo?.redis.usedMemoryPeak ?? 0,
                )}）`,
              },
              { label: 'Key 数', value: systemInfo?.redis.keys },
              { label: '连接数', value: systemInfo?.redis.connectedClients },
              { label: '每秒命令', value: systemInfo?.redis.opsPerSec },
            ]}
          />
        </Col>
        <Col span={12}>
          <ServiceCard
            title="PostgreSQL"
            ok={systemInfo?.pg.ok ?? false}
            latencyMs={systemInfo?.pg.latencyMs}
            rows={[
              { label: '版本', value: systemInfo?.pg.version },
              {
                label: '已运行',
                value: formatUptime(systemInfo?.pg.uptime ?? 0),
              },
              {
                label: '连接（活跃/空闲/上限）',
                value: `${systemInfo?.pg.activeConnections} / ${systemInfo?.pg.idleConnections} / ${systemInfo?.pg.maxConnections}`,
              },
              { label: '库大小', value: formatBytes(systemInfo?.pg.dbSize ?? 0) },
              {
                label: '缓存命中率',
                value: `${systemInfo?.pg.cacheHitRatio}%`,
                alert: (systemInfo?.pg.cacheHitRatio ?? 100) < 95,
              },
            ]}
          />
        </Col>
      </Row>

      {/* 接口监控 */}
      <Card title={`接口监控（${apiRed?.date ?? '当天'}）`}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="当天调用总量"
                value={apiRed?.total ?? 0}
                prefix={<ApiOutlined style={{ color: '#1677ff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title={`错误（5xx）/ 错误率 ${totalErrorRate}%`}
                value={apiRed?.totalErrors ?? 0}
                valueStyle={{
                  color: (apiRed?.totalErrors ?? 0) > 0 ? '#cf1322' : undefined,
                }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="慢请求（≥1s）"
                value={apiRed?.totalSlow ?? 0}
                valueStyle={{
                  color: (apiRed?.totalSlow ?? 0) > 0 ? '#d46b08' : undefined,
                }}
                prefix={<FieldTimeOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="被调用接口数"
                value={apiRed?.items.length ?? 0}
                prefix={<CheckCircleFilled style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
        </Row>
        <ProTable<ApiRedItem>
          rowKey={(row) => `${row.method} ${row.name}`}
          loading={redLoading && !apiRed}
          search={false}
          options={{ reload: false, density: false, setting: false }}
          dataSource={apiRed?.items ?? []}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          columns={[
            {
              title: '方法',
              dataIndex: 'method',
              width: 90,
              render: (_, row) => (
                <Tag color={METHOD_COLOR[row.method] ?? 'default'}>{row.method}</Tag>
              ),
            },
            { title: '接口', dataIndex: 'name' },
            {
              title: '当天调用',
              dataIndex: 'count',
              width: 100,
              sorter: (a, b) => a.count - b.count,
              defaultSortOrder: 'descend',
              render: (_, row) => <b>{row.count}</b>,
            },
            {
              title: '错误（5xx）',
              dataIndex: 'errors',
              width: 110,
              sorter: (a, b) => a.errors - b.errors,
              render: (_, row) =>
                row.errors > 0 ? (
                  <b style={{ color: '#ff4d4f' }}>{row.errors}</b>
                ) : (
                  <span style={{ color: '#bbb' }}>0</span>
                ),
            },
            {
              title: '错误率',
              dataIndex: 'errorRate',
              width: 100,
              sorter: (a, b) => a.errorRate - b.errorRate,
              render: (_, row) =>
                row.errorRate > 0 ? (
                  <Tag color="red">{row.errorRate}%</Tag>
                ) : (
                  <span style={{ color: '#bbb' }}>0%</span>
                ),
            },
            {
              title: '慢请求（≥1s）',
              dataIndex: 'slowCount',
              width: 120,
              sorter: (a, b) => a.slowCount - b.slowCount,
              render: (_, row) =>
                row.slowCount > 0 ? (
                  <b style={{ color: '#fa8c16' }}>{row.slowCount}</b>
                ) : (
                  <span style={{ color: '#bbb' }}>0</span>
                ),
            },
            {
              title: '近10分钟平均耗时',
              dataIndex: 'avgLatencyMs',
              width: 150,
              sorter: (a, b) => (a.avgLatencyMs ?? -1) - (b.avgLatencyMs ?? -1),
              render: (_, row) =>
                row.avgLatencyMs === null ? (
                  <span style={{ color: '#bbb' }}>-</span>
                ) : (
                  <span
                    style={{
                      color: row.avgLatencyMs >= 500 ? '#fa8c16' : undefined,
                    }}
                  >
                    {row.avgLatencyMs} ms
                  </span>
                ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};
