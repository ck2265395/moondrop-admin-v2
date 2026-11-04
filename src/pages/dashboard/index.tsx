import { getMetricsOverview } from '@/services/modules/metrics'
import { completeImgUrl } from '@/utils/utils'
import { PageContainer } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import {
  AppstoreOutlined,
  AudioTwoTone,
  TeamOutlined,
  ThunderboltTwoTone,
  UserOutlined,
} from '@ant-design/icons'
import { history } from '@umijs/max'
import {
  Avatar,
  Card,
  Col,
  Row,
  Statistic,
  Tag,
  Tooltip,
} from 'antd'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'
import styles from './index.less'

const SOURCE_LABEL: Record<string, string> = {
  product: '新产品',
  ota: 'OTA 固件',
  dongle: 'Dongle 固件',
  app: 'App 更新',
}

const SOURCE_COLOR: Record<string, string> = {
  product: '#722ed1',
  ota: '#13c2c2',
  dongle: '#eb2f96',
  app: '#1677ff',
}

const fmtPublishTime = (ts: number): string => {
  if (!ts) return '-'
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

/** 相对时间：刚 / N分钟前 / N小时前 / N天前 / N周前 / 绝对日期 */
const fmtRelative = (ts: number): string => {
  if (!ts) return '-'
  const diff = Date.now() - ts
  const sec = Math.max(0, diff / 1000)
  if (sec < 60) return '刚刚'
  const min = sec / 60
  if (min < 60) return `${Math.floor(min)} 分钟前`
  const hr = min / 60
  if (hr < 24) return `${Math.floor(hr)} 小时前`
  const day = hr / 24
  if (day < 7) return `${Math.floor(day)} 天前`
  const week = day / 7
  if (week < 4) return `${Math.floor(week)} 周前`
  return dayjs(ts).format('MM-DD HH:mm')
}

export default function DashboardPage() {
  const { data, loading } = useRequest(getMetricsOverview)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 用户注册趋势折线图（后端已返回 30 天 daily rows）
  useEffect(() => {
    if (!data?.user?.registrationTrend || !chartRef.current) return

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)
    }
    const chart = chartInstanceRef.current

    const dates = data.user.registrationTrend.map((r) =>
      dayjs(r.date).format('MM-DD'),
    )
    const counts = data.user.registrationTrend.map((r) => r.count)

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as { axisValueLabel: string; value: number }[])[0]
          return `${p.axisValueLabel}<br/>新增用户：<b>${p.value}</b>`
        },
      },
      grid: { top: 24, right: 16, bottom: 24, left: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { color: '#8c8c8c', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#8c8c8c', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          data: counts,
          lineStyle: { width: 2, color: '#1677ff' },
          itemStyle: { color: '#1677ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,119,255,0.28)' },
              { offset: 1, color: 'rgba(22,119,255,0.02)' },
            ]),
          },
        },
      ],
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [data?.user?.registrationTrend])

  useEffect(() => () => chartInstanceRef.current?.dispose(), [])

  const todayNewFeedback = data?.feedback.todayNewCount ?? 0

  return (
    <PageContainer title={false}>
      {/* 第一行：全局概览 */}
      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="总用户数"
              value={data?.user.total ?? 0}
              prefix={
                <TeamOutlined style={{ fontSize: 26, color: '#1677ff' }} />
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="产品总数"
              value={data?.productTotal ?? 0}
              prefix={
                <AppstoreOutlined style={{ fontSize: 26, color: '#722ed1' }} />
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="PEQ 配置总数"
              value={data?.peqConfigTotal ?? 0}
              prefix={
                <AudioTwoTone style={{ fontSize: 26 }} twoToneColor="#13c2c2" />
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="今日新增反馈"
              value={todayNewFeedback}
              suffix={
                data?.feedback
                  ? `（待处理 ${data.feedback.pendingCount}）`
                  : undefined
              }
              valueStyle={{
                color: todayNewFeedback > 0 ? '#722ed1' : undefined,
              }}
              prefix={
                <ThunderboltTwoTone
                  style={{ fontSize: 26 }}
                  twoToneColor={todayNewFeedback > 0 ? '#722ed1' : '#8c8c8c'}
                />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行：用户增长趋势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="今日新增"
              value={data?.user.todayNew ?? 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="昨日新增"
              value={data?.user.yesterdayNew ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="近 7 日新增"
              value={data?.user.last7DaysNew ?? 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="近 30 日新增"
              value={data?.user.last30DaysNew ?? 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 第三行：用户注册趋势图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="用户注册趋势（近 30 天）"
            loading={loading}
            extra={
              data?.user ? (
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  今日 <b style={{ color: '#1677ff' }}>{data.user.todayNew}</b>
                  {' · '}
                  近 7 天{' '}
                  <b style={{ color: '#722ed1' }}>{data.user.last7DaysNew}</b>
                  {' · '}
                  近 30 天{' '}
                  <b style={{ color: '#fa8c16' }}>{data.user.last30DaysNew}</b>
                </span>
              ) : undefined
            }
          >
            <div ref={chartRef} style={{ width: '100%', height: 220 }} />
          </Card>
        </Col>
      </Row>

      {/* 第四行：最新反馈 + 最近发布 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="最新反馈"
            loading={loading}
            className={styles.clickableCard}
            onClick={() => history.push('/userFeedback')}
          >
            {(data?.feedback.recent?.length ?? 0) > 0 ? (
              <ul className={styles.feedList}>
                {data!.feedback.recent!.map((f) => (
                  <li key={f.uuid} className={styles.feedItem}>
                    <Avatar
                      size={36}
                      src={f.avatar ? completeImgUrl(f.avatar) : undefined}
                      icon={<UserOutlined />}
                      style={{ flexShrink: 0, backgroundColor: '#1677ff' }}
                    />
                    <div className={styles.feedBody}>
                      <div className={styles.feedMeta}>
                        <span className={styles.feedUser}>{f.username || '匿名用户'}</span>
                        {f.productName ? (
                          <span className={styles.feedVerb}>
                            提交了 <b className={styles.feedProduct}>{f.productName}</b> 的反馈
                          </span>
                        ) : (
                          <span className={styles.feedVerb}>提交了反馈</span>
                        )}
                        <Tooltip title={fmtPublishTime(f.publishTime)}>
                          <span className={styles.feedTime}>{fmtRelative(f.publishTime)}</span>
                        </Tooltip>
                      </div>
                      <div className={styles.feedContent}>{f.content || '（无内容）'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>暂无反馈</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最近发布" loading={loading}>
            {(data?.recentReleases?.length ?? 0) > 0 ? (
              <ul className={styles.feedList}>
                {data!.recentReleases!.map((r) => {
                  const isEnabled = r.status === 1
                  const mainText = isEnabled
                    ? `${r.title}${r.version ? `（${r.version}）` : ''}  正式发布`
                    : `${r.title}  待发布`
                  return (
                    <li key={r.source + r.publishTime} className={styles.feedItem}>
                      <div className={styles.feedBody}>
                        <div className={styles.feedMeta}>
                          <Tag
                            color={SOURCE_COLOR[r.source] ?? 'blue'}
                            style={{ marginLeft: 0, marginRight: 0, fontSize: 11, lineHeight: '18px' }}
                          >
                            {SOURCE_LABEL[r.source] ?? r.source}
                          </Tag>
                          <span
                            className={styles.releaseName}
                            style={{ color: isEnabled ? undefined : '#faad14' }}
                          >
                            {mainText}
                          </span>
                          <Tooltip title={fmtPublishTime(r.publishTime)}>
                            <span className={styles.feedTime}>{fmtRelative(r.publishTime)}</span>
                          </Tooltip>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className={styles.empty}>暂无发布</div>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}
