import { getMetricsOverview } from '@/services/modules/metrics'
import { PageContainer } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import {
  ApiOutlined,
  ApiTwoTone,
  AudioTwoTone,
  ExclamationCircleTwoTone,
  FileTwoTone,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import styles from './index.less'

const STATUS_COLOR: Record<string, string> = {
  collected: 'default',
  pending: 'orange',
  completed: 'green',
  replied: 'blue',
  archived: 'default',
  refused: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  collected: '已收集',
  pending: '待处理',
  completed: '已完成',
  replied: '已回复',
  archived: '已归档',
  refused: '已拒绝',
}

const ACTION_COLOR: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
}

const fmtPublishTime = (ts: number): string => {
  if (!ts) return '-'
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

const fmtDateTime = (v: string | Date): string => {
  if (!v) return '-'
  return dayjs(v).format('YYYY-MM-DD HH:mm')
}

const truncate = (s: string, max = 36): string => {
  if (!s) return ''
  return s.length > max ? `${s.slice(0, max)}…` : s
}

export default function DashboardPage() {
  const { data, loading } = useRequest(getMetricsOverview)

  // ----- 操作日志表格列 -----
  const logColumns: ColumnsType = [
    {
      title: '操作时间',
      dataIndex: 'createTime',
      width: 150,
      render: (v: string | Date) => fmtDateTime(v),
    },
    {
      title: '管理员',
      dataIndex: 'adminUsername',
      width: 120,
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 130,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 90,
      render: (v: string) => (
        <Tag color={ACTION_COLOR[v] ?? 'default'}>{v}</Tag>
      ),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>{truncate(v, 48)}</Tooltip>
      ),
    },
  ]

  // ----- 最新反馈表格列 -----
  const feedbackColumns: ColumnsType = [
    {
      title: '时间',
      dataIndex: 'publishTime',
      width: 140,
      render: (v: number) => fmtPublishTime(v),
    },
    {
      title: '用户',
      dataIndex: 'username',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '产品',
      dataIndex: 'productName',
      width: 130,
      render: (v: string | null) => v || '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>{truncate(v, 40)}</Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Tag>
      ),
    },
  ]

  const pendingCount = data?.feedback.pendingCount ?? 0
  const totalErrorRate =
    data && data.apiToday.total > 0
      ? Math.round((data.apiToday.totalErrors / data.apiToday.total) * 100)
      : 0

  return (
    <PageContainer title={false} breadcrumbRender={() => null}>
      {/* 第一行：核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="总用户数"
              value={data?.user.total ?? 0}
              suffix={
                data?.user
                  ? `（今日 +${data.user.todayNew}）`
                  : undefined
              }
              prefix={
                <TeamOutlined style={{ fontSize: 28, color: '#1677ff' }} />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="产品总数"
              value={data?.productTotal ?? 0}
              prefix={
                <ApiTwoTone style={{ fontSize: 28 }} twoToneColor="#722ed1" />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="PEQ 配置总数"
              value={data?.peqConfigTotal ?? 0}
              prefix={
                <AudioTwoTone style={{ fontSize: 28 }} twoToneColor="#13c2c2" />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title={
                <span>
                  待处理反馈
                  {pendingCount > 0 && (
                    <ExclamationCircleTwoTone
                      style={{ marginLeft: 8, fontSize: 16 }}
                      twoToneColor="#faad14"
                    />
                  )}
                </span>
              }
              value={pendingCount}
              valueStyle={{
                color: pendingCount > 0 ? '#cf1322' : undefined,
              }}
              suffix={
                data?.feedback
                  ? `（共 ${data.feedback.total}）`
                  : undefined
              }
              prefix={
                <FileTwoTone
                  style={{ fontSize: 28 }}
                  twoToneColor={pendingCount > 0 ? '#ff4d4f' : '#fa8c16'}
                />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行：API 健康 + 用户趋势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="今日 API 健康" loading={loading}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  value={data?.apiToday.total ?? 0}
                  title="调用总量"
                  prefix={<ApiOutlined style={{ color: '#1677ff' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  value={data?.apiToday.totalErrors ?? 0}
                  title={`错误（${totalErrorRate}%）`}
                  valueStyle={{
                    color:
                      (data?.apiToday.totalErrors ?? 0) > 0
                        ? '#cf1322'
                        : undefined,
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  value={data?.apiToday.totalSlow ?? 0}
                  title="慢请求（≥1s）"
                  valueStyle={{
                    color:
                      (data?.apiToday.totalSlow ?? 0) > 0
                        ? '#d46b08'
                        : undefined,
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="用户新增" loading={loading}>
            {data?.user && (
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    value={data.user.todayNew}
                    title="今日新增"
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic value={data.user.yesterdayNew} title="昨日新增" />
                </Col>
                <Col span={6}>
                  <Statistic
                    value={data.user.last7DaysNew}
                    title="近 7 天"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    value={data.user.last30DaysNew}
                    title="近 30 天"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* 第三行：操作日志 + 最新反馈 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="最近操作日志" loading={loading}>
            <Table
              size="small"
              rowKey="uuid"
              pagination={false}
              dataSource={data?.operationLog.recent ?? []}
              columns={logColumns}
              locale={{ emptyText: '暂无操作日志' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最新反馈" loading={loading}>
            <Table
              size="small"
              rowKey="uuid"
              pagination={false}
              dataSource={data?.feedback.recent ?? []}
              columns={feedbackColumns}
              locale={{ emptyText: '暂无反馈' }}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}
