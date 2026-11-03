import { useRequest } from 'ahooks';
import { Radio } from 'antd';
import type { EChartsCoreOption } from 'echarts/core';
import { useMemo, useState } from 'react';

import EChart from '@/components/EChart';
import {
  getStsVersion,
  Latitude,
  ProblemTypeLabel,
  ProblemTypes,
  type VersionTracking as VersionTrackingDatum,
} from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';
import './VersionTracking.less';

enum DisplayMode {
  COUNT = 'count',
  PERCENT = 'percent',
}

const PROBLEM_COLORS = [
  '#ffb45b',
  '#9bdc65',
  '#52b83a',
  '#6741a5',
  '#9064cc',
  '#ff4b4b',
  '#a3a5dc',
  '#1e9fff',
  '#6b9bd2',
  '#a9c7e8',
  '#ffb7a3',
  '#0068c8',
  '#ff7a00',
];

const getProblemLabel = (type?: string) =>
  ProblemTypeLabel[type ?? ''] ?? type ?? ProblemTypeLabel.other;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

const hasUsableVersionData = (data: VersionTrackingDatum[]) =>
  data.some((item) => Boolean(item.version?.trim()) && Number(item.cnt) > 0);

const buildVersionOption = (
  data: VersionTrackingDatum[],
  title: string,
  versionTitle: string,
  displayMode: DisplayMode,
  legendTitleRight = 78,
): EChartsCoreOption => {
  const versions = [...new Set(data.map((item) => item.version || '未知版本'))];
  const problemTypes = [...new Set(data.map((item) => item.problemType ?? 'other'))];
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();

  data.forEach((item) => {
    const version = item.version || '未知版本';
    const problemType = item.problemType ?? 'other';
    const key = `${version}\u0000${problemType}`;
    const count = Number(item.cnt) || 0;
    counts.set(key, (counts.get(key) ?? 0) + count);
    totals.set(version, (totals.get(version) ?? 0) + count);
  });

  const sortedTypes = [...problemTypes].sort(
    (a, b) =>
      ProblemTypes.findIndex((item) => item.value === a) -
      ProblemTypes.findIndex((item) => item.value === b),
  );

  return {
    title: { text: title },
    color: sortedTypes.map((type) => {
      const colorIndex = ProblemTypes.findIndex((item) => item.value === type);
      return PROBLEM_COLORS[colorIndex < 0 ? 0 : colorIndex];
    }),
    grid: { left: 60, right: 150, top: 64, bottom: 110, containLabel: true },
    xAxis: {
      type: 'category',
      data: versions,
      name: versionTitle,
      nameLocation: 'middle',
      nameGap: 82,
      axisLabel: { rotate: 90, interval: 0, color: '#8c8c9e', fontSize: 9 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: displayMode === DisplayMode.COUNT ? '反馈条数' : '堆叠百分比',
      nameLocation: 'middle',
      nameRotate: 90,
      nameGap: 42,
      minInterval: displayMode === DisplayMode.COUNT ? 1 : undefined,
      max: displayMode === DisplayMode.PERCENT ? 100 : undefined,
      axisLabel:
        displayMode === DisplayMode.PERCENT
          ? { formatter: (value: number) => `${value}%` }
          : undefined,
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: false,
        moveOnMouseMove: false,
      },
    ],
    legend: {
      type: 'scroll',
      orient: 'vertical',
      align: 'left',
      right: 8,
      top: 82,
      bottom: 16,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#595959', fontSize: 11 },
    },
    graphic: [
      {
        type: 'text',
        right: legendTitleRight,
        top: 60,
        style: { text: '问题类型', fill: '#8c8c9e', fontSize: 12 },
        silent: true,
      },
    ],
    tooltip: {
      trigger: 'item',
      className: 'version-tracking-tooltip',
      backgroundColor: '#fff',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      padding: [4, 6],
      textStyle: { color: '#8c8c9e', fontSize: 14 },
      extraCssText: 'overflow:visible;box-shadow:none;border:0;border-radius:0;',
      position: (
        point: [number, number],
        _params: unknown,
        _element: unknown,
        rect: { x: number; y: number; width: number; height: number } | undefined,
        size: { contentSize: [number, number]; viewSize: [number, number] },
      ) => {
        const [contentWidth, contentHeight] = size.contentSize;
        const [viewWidth, viewHeight] = size.viewSize;
        const anchorX = rect ? rect.x + rect.width : point[0];
        const anchorY = rect ? rect.y + rect.height / 2 : point[1];
        return [
          Math.min(anchorX + 10, viewWidth - contentWidth - 8),
          Math.max(8, Math.min(anchorY - contentHeight / 2, viewHeight - contentHeight - 8)),
        ];
      },
      formatter: (params: unknown) => {
        if (!params || typeof params !== 'object' || !('data' in params)) return '';
        const tooltipParams = params as {
          data?: { count?: number; value?: number; version?: string };
          name?: string;
          seriesName?: string;
        };
        const point = tooltipParams.data;
        if (!point) return '';
        const yPlotLabel =
          displayMode === DisplayMode.COUNT
            ? `数量=${point.count ?? 0}`
            : `百分比=${Number(point.value ?? 0).toFixed(1)}%`;
        return `<div class="version-tracking-tooltip__content">
          <div>问题类型=${escapeHtml(tooltipParams.seriesName ?? '')}</div>
          <div>版本=${escapeHtml(point.version ?? tooltipParams.name ?? '')}</div>
          <div>${yPlotLabel}</div>
        </div>`;
      },
    },
    series: sortedTypes.map((type, typeIndex) => ({
      name: getProblemLabel(type),
      type: 'bar',
      stack: 'total',
      barCategoryGap: '35%',
      data: versions.map((version) => {
        const count = counts.get(`${version}\u0000${type}`) ?? 0;
        const total = totals.get(version) ?? 0;
        const isTopSegment =
          count > 0 &&
          !sortedTypes
            .slice(typeIndex + 1)
            .some((nextType) => (counts.get(`${version}\u0000${nextType}`) ?? 0) > 0);
        return {
          value: displayMode === DisplayMode.COUNT ? count : total > 0 ? (count / total) * 100 : 0,
          count,
          version,
          label: {
            show: isTopSegment,
            position: 'top',
            color: '#8c8c9e',
            fontSize: 10,
            formatter: displayMode === DisplayMode.COUNT ? `${total}` : total > 0 ? '100%' : '',
          },
        };
      }),
    })),
  };
};

export default function VersionTracking() {
  const { searchParams, latitude } = usePageContext();
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.COUNT);

  const params = useMemo(
    () => ({
      ...searchParams,
      latitude: Latitude.VERSION_TRACKING,
    }),
    [searchParams, latitude],
  );

  const { data, loading } = useRequest(() => getStsVersion(params), {
    refreshDeps: [params],
  });

  const appData = data?.app ?? [];
  const otaData = data?.ota ?? [];
  const hasProductSelected = Boolean(searchParams.product_uuid);
  const hasAppData = hasUsableVersionData(appData);
  const hasOtaData = hasUsableVersionData(otaData);
  const appOption = useMemo(
    () => buildVersionOption(appData, 'APP版本问题追踪', 'APP版本', displayMode),
    [appData, displayMode],
  );
  const otaOption = useMemo(
    () => buildVersionOption(otaData, '固件版本问题追踪', '固件版本', displayMode, 60),
    [otaData, displayMode],
  );

  const displayModeSelector = (
    <Radio.Group value={displayMode} onChange={(event) => setDisplayMode(event.target.value)}>
      <Radio value={DisplayMode.COUNT}>绝对条数</Radio>
      <Radio value={DisplayMode.PERCENT}>堆叠百分比（各版本合计100%）</Radio>
    </Radio.Group>
  );
  const chartHeader = <div className="version-tracking__header">{displayModeSelector}</div>;

  const appEmptyState = (
    <div className="version-tracking__empty">当前筛选下缺少可用的 APP 版本或反馈数据。</div>
  );
  const otaEmptyState = (
    <div className="version-tracking__empty">
      {hasProductSelected
        ? '当前筛选下缺少可用的固件版本或反馈数据。'
        : '请在筛选区域「产品型号」中选择单一型号后再查看固件版本问题追踪。'}
    </div>
  );

  const renderEmptyCard = (content: React.ReactNode) => (
    <div className="version-tracking__empty-card">
      <div className="version-tracking__header">{displayModeSelector}</div>
      {content}
    </div>
  );

  return (
    <div className="version-tracking">
      {loading || hasAppData ? (
        <EChart
          height={560}
          option={appOption}
          loading={loading}
          header={chartHeader}
          toolboxOnHover
          zoomOnMouseWheel={false}
        />
      ) : (
        renderEmptyCard(appEmptyState)
      )}
      {!hasProductSelected ? (
        renderEmptyCard(otaEmptyState)
      ) : loading || hasOtaData ? (
        <EChart
          height={560}
          option={otaOption}
          loading={loading}
          header={chartHeader}
          toolboxOnHover
          zoomOnMouseWheel={false}
        />
      ) : (
        renderEmptyCard(otaEmptyState)
      )}
    </div>
  );
}
