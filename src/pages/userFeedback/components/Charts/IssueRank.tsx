import { useRequest } from 'ahooks';
import type { EChartsCoreOption } from 'echarts/core';
import { useMemo } from 'react';

import type { ToolboxFeature } from '@/components/EChart';
import EChart, { CHART_RED } from '@/components/EChart';
import {
  getStatistics,
  Latitude,
  ProblemType,
  ProblemTypeLabel,
} from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';

interface IssueAggregated {
  problemType: string;
  problemLabel: string;
  cnt: number;
  percent: number;
}

// 帕累托图不支持柱/线切换（双轴语义不同），其余工具保留
const TOOLBOX_FEATURES: ToolboxFeature[] = [
  'saveAsImage',
  'dataZoom',
  'zoomIn',
  'zoomOut',
  'restore',
  'fullScreen',
];

const ISSUE_BAR_COLORS = [
  '#cbdff0',
  '#ffb45b',
  '#36a232',
  '#a6d883',
  '#ffb7a3',
  '#4b9bd3',
  '#aaa9cf',
  '#69449e',
  '#f04435',
  '#1769aa',
  '#ff8500',
  '#8fc3dc',
  '#8178d5',
];

export default function IssueRank() {
  const { searchParams, latitude } = usePageContext();

  const params = useMemo(() => {
    return {
      ...searchParams,
      latitude: Latitude.ISSUE,
    };
  }, [searchParams, latitude]);

  const { data, loading } = useRequest(
    () => {
      return getStatistics(params);
    },
    {
      refreshDeps: [params],
    },
  );

  const chartData = useMemo<IssueAggregated[]>(() => {
    const list = data ?? [];
    const map = new Map<string, IssueAggregated>();
    for (const item of list) {
      const problemType = item.problemType || ProblemType.OTHER;
      const problemLabel = ProblemTypeLabel[problemType] ?? '其他';
      const cnt = Number(item.cnt) || 0;
      const prev = map.get(problemLabel);
      if (prev) {
        prev.cnt += cnt;
      } else {
        map.set(problemLabel, { problemType, problemLabel, cnt, percent: 0 });
      }
    }

    const sorted = [...map.values()].sort((a, b) => b.cnt - a.cnt);
    const total = sorted.reduce((sum, item) => sum + item.cnt, 0);
    let current = 0;
    for (const item of sorted) {
      current += item.cnt;
      item.percent = total > 0 ? Number(((current / total) * 100).toFixed(2)) : 0;
    }
    return sorted;
  }, [data]);

  const option = useMemo<EChartsCoreOption>(() => {
    return {
      title: { text: '问题类型帕累托图' },
      legend: {
        top: 64,
        left: 'center',
        itemWidth: 14,
        itemHeight: 10,
        textStyle: { color: '#595959' },
      },
      grid: { left: 42, right: 42, top: 104, bottom: 100, containLabel: true },
      xAxis: {
        data: chartData.map((item) => item.problemLabel),
        name: '问题类型',
        nameLocation: 'middle',
        nameGap: 74,
        axisLabel: { rotate: 40, interval: 0, margin: 12 },
      },
      yAxis: [
        {
          name: '反馈条数',
          nameLocation: 'middle',
          nameGap: 44,
          minInterval: 1,
        },
        {
          name: '反馈占比(%)',
          nameLocation: 'middle',
          nameGap: 42,
          min: 0,
          max: 100,
          interval: 20,
          splitLine: { show: false },
        },
      ],
      dataZoom: [{ type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: false }],
      series: [
        {
          name: '反馈条数',
          type: 'bar',
          barCategoryGap: '22%',
          data: chartData.map((item, index) => ({
            value: item.cnt,
            itemStyle: { color: ISSUE_BAR_COLORS[index % ISSUE_BAR_COLORS.length] },
          })),
        },
        {
          name: '累积占比',
          type: 'line',
          yAxisIndex: 1,
          smooth: false,
          symbol: 'circle',
          symbolSize: 7,
          data: chartData.map((item) => item.percent),
          lineStyle: { width: 2, color: CHART_RED },
          itemStyle: { color: CHART_RED },
        },
      ],
    };
  }, [chartData]);

  return (
    <EChart
      height={700}
      option={option}
      loading={loading}
      features={TOOLBOX_FEATURES}
      zoomOnMouseWheel={false}
    />
  );
}
