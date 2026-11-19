import type { DashboardRegionItem } from '@/services/modules/metrics'
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

/** 地域分布横向条形图：接口已按人数倒序，图表反转后第一名在最上方 */
const renderRegionChart = (
  instanceRef: { current: echarts.ECharts | null },
  el: HTMLDivElement | null,
  items: DashboardRegionItem[] | undefined,
  color: string,
  count = 10,
) => {
  if (!el || !items?.length) return
  if (!instanceRef.current) instanceRef.current = echarts.init(el)
  const list = items.slice(0, count).slice().reverse()
  instanceRef.current.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0]
          return `${p.name}<br/>用户数：<b>${p.value}</b>`
        },
      },
      grid: { top: 8, right: 40, bottom: 8, left: 8, containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#8c8c8c', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      yAxis: {
        type: 'category',
        data: list.map((item) => item.name),
        axisLabel: { color: '#595959', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: list.map((item) => item.value),
          barMaxWidth: 14,
          itemStyle: { color, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            color: '#8c8c8c',
            fontSize: 11,
          },
        },
      ],
    },
    true,
  )
}

/** 省份简称 → 地图数据全称（兼容 ip2region 可能返回的简称） */
const CHINA_PROVINCE_ALIAS: Record<string, string> = {
  北京: '北京市',
  天津: '天津市',
  上海: '上海市',
  重庆: '重庆市',
  河北: '河北省',
  山西: '山西省',
  内蒙古: '内蒙古自治区',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  福建: '福建省',
  江西: '江西省',
  山东: '山东省',
  河南: '河南省',
  湖北: '湖北省',
  湖南: '湖南省',
  广东: '广东省',
  广西: '广西壮族自治区',
  海南: '海南省',
  四川: '四川省',
  贵州: '贵州省',
  云南: '云南省',
  西藏: '西藏自治区',
  陕西: '陕西省',
  甘肃: '甘肃省',
  青海: '青海省',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  台湾: '台湾省',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
}

const normalizeProvince = (name: string): string =>
  CHINA_PROVINCE_ALIAS[name] ?? name

let chinaMapPromise: Promise<void> | null = null

/** 加载并注册中国地图（public/maps/china.json，相对部署路径） */
const loadChinaMap = (): Promise<void> => {
  if (!chinaMapPromise) {
    chinaMapPromise = fetch('maps/china.json')
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap('china', geoJson)
      })
      .catch((error) => {
        chinaMapPromise = null
        throw error
      })
  }
  return chinaMapPromise
}

/** 国内用户地域分布地图（省份热力） */
const renderChinaMap = async (
  instanceRef: { current: echarts.ECharts | null },
  el: HTMLDivElement,
  items: DashboardRegionItem[],
) => {
  try {
    await loadChinaMap()
  } catch {
    return
  }
  if (!instanceRef.current) instanceRef.current = echarts.init(el)
  const data = items.map((item) => ({
    name: normalizeProvince(item.name),
    value: item.value,
  }))
  const max = Math.max(...data.map((item) => item.value), 1)
  instanceRef.current.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value?: number }
          return `${p.name}<br/>用户数：<b>${p.value ?? 0}</b>`
        },
      },
      visualMap: {
        min: 0,
        max,
        left: 8,
        bottom: 8,
        text: ['高', '低'],
        calculable: true,
        inRange: { color: ['#e6f4ff', '#1677ff'] },
        textStyle: { color: '#8c8c8c', fontSize: 11 },
      },
      series: [
        {
          type: 'map',
          map: 'china',
          roam: false,
          zoom: 1.1,
          label: { show: false },
          itemStyle: { areaColor: '#fafafa', borderColor: '#d9d9d9' },
          emphasis: {
            label: { show: true, fontSize: 11 },
            itemStyle: { areaColor: '#faad14' },
          },
          data,
        },
      ],
    },
    true,
  )
}

export default function DashboardPage() {
  const { data, loading } = useRequest(getMetricsOverview)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const domesticChartRef = useRef<HTMLDivElement>(null)
  const domesticChartInstanceRef = useRef<echarts.ECharts | null>(null)
  const overseasChartRef = useRef<HTMLDivElement>(null)
  const overseasChartInstanceRef = useRef<echarts.ECharts | null>(null)
  const chinaMapRef = useRef<HTMLDivElement>(null)
  const chinaMapInstanceRef = useRef<echarts.ECharts | null>(null)

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

  // 用户地域分布（国内按省 / 海外按国家）
  useEffect(() => {
    const distribution = data?.user?.regionDistribution
    if (!distribution) return

    renderRegionChart(
      domesticChartInstanceRef,
      domesticChartRef.current,
      distribution.domestic,
      '#1677ff',
      5,
    )
    renderRegionChart(
      overseasChartInstanceRef,
      overseasChartRef.current,
      distribution.overseas,
      '#722ed1',
      5,
    )
    if (chinaMapRef.current && distribution.domestic.length > 0) {
      void renderChinaMap(
        chinaMapInstanceRef,
        chinaMapRef.current,
        distribution.domestic,
      )
    }

    const handleResize = () => {
      domesticChartInstanceRef.current?.resize()
      overseasChartInstanceRef.current?.resize()
      chinaMapInstanceRef.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [data?.user?.regionDistribution])

  useEffect(
    () => () => {
      chartInstanceRef.current?.dispose()
      domesticChartInstanceRef.current?.dispose()
      overseasChartInstanceRef.current?.dispose()
      chinaMapInstanceRef.current?.dispose()
    },
    [],
  )

  const todayNewFeedback = data?.feedback.todayNewCount ?? 0
  const domesticRegions = data?.user?.regionDistribution?.domestic ?? []
  const overseasRegions = data?.user?.regionDistribution?.overseas ?? []

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
              title="今日新增用户"
              value={data?.user.todayNew ?? 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="昨日新增用户"
              value={data?.user.yesterdayNew ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="近 7 日新增用户"
              value={data?.user.last7DaysNew ?? 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={loading} className={styles.statCard}>
            <Statistic
              title="近 30 日新增用户"
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

      {/* 第四行：用户地域分布（地图 + 榜单） */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="国内用户地域分布地图" loading={loading}>
            {domesticRegions.length > 0 ? (
              <div ref={chinaMapRef} style={{ width: '100%', height: 380 }} />
            ) : (
              <div className={styles.empty}>暂无地域数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Card title="国内用户地域分布（Top 5）" loading={loading}>
                {domesticRegions.length > 0 ? (
                  <div
                    ref={domesticChartRef}
                    style={{ width: '100%', height: 154 }}
                  />
                ) : (
                  <div className={styles.empty}>暂无地域数据</div>
                )}
              </Card>
            </Col>
            <Col span={24}>
              <Card title="海外用户地域分布（Top 5）" loading={loading}>
                {overseasRegions.length > 0 ? (
                  <div
                    ref={overseasChartRef}
                    style={{ width: '100%', height: 154 }}
                  />
                ) : (
                  <div className={styles.empty}>暂无地域数据</div>
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* 第五行：最新反馈 + 最近发布 */}
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
                      <div className={styles.feedContent}>
                        <div className={styles.feedContentInner}>
                          {f.content || '（无内容）'}
                        </div>
                      </div>
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
