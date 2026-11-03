import { useRequest } from 'ahooks';
import { Radio } from 'antd';
import type { EChartsCoreOption } from 'echarts/core';
import { useMemo, useState } from 'react';

import EChart, { CHART_BLUE } from '@/components/EChart';
import { getStatistics, Latitude, ProblemTypeLabel } from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';
import './Trend.less';

export enum GranularityType {
  DALIY = 1,
  MONTHLY = 2,
}

const PROBLEM_COLORS = [
  '#ffb45b',
  '#ff7a00',
  '#9bdc65',
  '#52b83a',
  '#ffb7a3',
  '#ff4b4b',
  '#9064cc',
  '#6741a5',
  '#a3a5dc',
  '#0068c8',
  '#1e9fff',
  '#6b9bd2',
  '#a9c7e8',
];

const toTimestamp = (value?: Date): number | undefined => {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

const formatAxisDate = (value: number): string =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const baseTrendOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'line',
      lineStyle: { color: '#737987', type: 'dashed' },
    },
    valueFormatter: (value: number) => `${value}`,
  },
  xAxis: {
    type: 'time',
    splitNumber: 6,
    axisLabel: { formatter: formatAxisDate },
    name: '日期',
    nameLocation: 'middle',
    nameGap: 30,
  },
  yAxis: {
    type: 'value',
    name: '条数',
    nameLocation: 'middle',
    nameGap: 42,
    minInterval: 1,
  },
  dataZoom: [],
};

export default function TrendLine() {
  const [granularity, setGranularity] = useState<GranularityType>(GranularityType.DALIY);
  const { searchParams } = usePageContext();

  const params = useMemo(
    () => ({
      ...searchParams,
      latitude: Latitude.TREND,
      data_type: granularity,
    }),
    [searchParams, granularity],
  );

  const { data, loading } = useRequest(() => getStatistics(params), {
    refreshDeps: [params],
  });

  const { trendData: totalTrendSeriesData, granularityData: typeTrendSeriesData } = useMemo(() => {
    const totals = new Map<number, number>();
    const typeTotals = new Map<string, Map<number, number>>();

    for (const item of data ?? []) {
      const timestamp = toTimestamp(item.publishDay);
      if (timestamp === undefined) continue;

      const count = Number(item.cnt) || 0;
      totals.set(timestamp, (totals.get(timestamp) ?? 0) + count);

      const problemLabel = ProblemTypeLabel[item.problemType ?? 'other'] ?? '其他';
      const countsByDate = typeTotals.get(problemLabel) ?? new Map<number, number>();
      countsByDate.set(timestamp, (countsByDate.get(timestamp) ?? 0) + count);
      typeTotals.set(problemLabel, countsByDate);
    }

    const dates = [...totals.keys()].sort((a, b) => a - b);
    const trendData = dates.map((timestamp) => ({
      value: [timestamp, totals.get(timestamp) ?? 0],
    }));
    const granularityData = [...typeTotals.entries()].map(([label, countsByDate], index) => {
      const color = PROBLEM_COLORS[index % PROBLEM_COLORS.length];
      return {
        name: label,
        type: 'line' as const,
        showSymbol: true,
        symbol: 'circle' as const,
        symbolSize: 4,
        connectNulls: false,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        data: dates.map((timestamp) => [timestamp, countsByDate.get(timestamp) ?? null]),
      };
    });

    return { trendData, granularityData };
  }, [data]);

  const trendOption = useMemo<EChartsCoreOption>(
    () => ({
      ...baseTrendOption,
      title: { text: '反馈总量趋势' },
      toolbox: { top: 0 },
      grid: { left: 56, right: 28, top: 64, bottom: 52, containLabel: true },
      series: [
        {
          name: '反馈条数',
          type: 'line',
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 4,
          data: totalTrendSeriesData,
          lineStyle: { width: 2, color: CHART_BLUE },
          itemStyle: { color: CHART_BLUE },
        },
      ],
    }),
    [totalTrendSeriesData],
  );

  const trendByTypeOption = useMemo<EChartsCoreOption>(
    () => ({
      ...baseTrendOption,
      color: PROBLEM_COLORS,
      title: { text: '各类型反馈趋势' },
      toolbox: { top: 0 },
      grid: { left: 54, right: 160, top: 64, bottom: 52, containLabel: true },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 8,
        top: 76,
        bottom: 12,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: '#595959', fontSize: 11 },
      },
      graphic: [
        {
          type: 'text',
          right: 72,
          top: 54,
          style: {
            text: '问题类型',
            fill: '#8c8c9e',
            fontSize: 12,
          },
          silent: true,
        },
      ],
      series: typeTrendSeriesData,
    }),
    [typeTrendSeriesData],
  );

  const buildHeader = (showLegendHint = false) => (
    <div className="feedback-trend__header">
      <Radio.Group onChange={(event) => setGranularity(event.target.value)} value={granularity}>
        <Radio value={GranularityType.DALIY}>每日</Radio>
        <Radio value={GranularityType.MONTHLY}>每周</Radio>
      </Radio.Group>
      {showLegendHint ? (
        <span className="feedback-trend__legend-hint">
          普通点击切换显隐；Ctrl+点击或双击仅显示当前类型
        </span>
      ) : null}
    </div>
  );

  return (
    <div className="feedback-trend">
      <EChart
        height={400}
        option={trendOption}
        loading={loading}
        header={buildHeader()}
        toolboxOnHover
        zoomOnMouseWheel={false}
      />
      <EChart
        height={400}
        option={trendByTypeOption}
        loading={loading}
        header={buildHeader(true)}
        toolboxOnHover
        zoomOnMouseWheel={false}
      />
    </div>
  );
}
