import { useRequest } from 'ahooks';
import type { EChartsCoreOption } from 'echarts/core';
import { useMemo } from 'react';

import EChart, { CHART_BLUE } from '@/components/EChart';
import { getStatistics, Latitude } from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';

export default function UserData() {
  const { searchParams } = usePageContext();

  const params = useMemo(() => {
    return {
      ...searchParams,
      latitude: Latitude.USER_DATA,
    };
  }, [searchParams]);

  const { data, loading } = useRequest(
    () => {
      return getStatistics(params);
    },
    {
      refreshDeps: [params],
    },
  );

  const option = useMemo<EChartsCoreOption>(() => {
    const list = data ?? [];
    return {
      title: {
        text: '手机品牌用户排行',
        left: 30,
        top: 38,
        textStyle: { fontSize: 22, fontWeight: 600, color: 'rgba(0,0,0,.85)' },
      },
      grid: {
        left: 108,
        right: 24,
        top: 128,
        bottom: 150,
        containLabel: true,
      },
      xAxis: {
        name: '手机品牌',
        nameLocation: 'middle',
        nameGap: 82,
        nameTextStyle: { fontSize: 15, color: '#8c8c9e' },
        data: list.map((item) => item.brand ?? '--'),
        axisLabel: { rotate: 40, interval: 0, fontSize: 14, color: '#8c8c9e' },
      },
      yAxis: {
        name: '反馈用户数量',
        nameLocation: 'middle',
        nameGap: 80,
        nameTextStyle: { fontSize: 18, color: '#8c8c9e' },
        axisLabel: { fontSize: 14, color: '#8c8c9e' },
        splitLine: { lineStyle: { color: '#e3e7ef', width: 1 } },
      },
      series: [
        {
          type: 'bar',
          barCategoryGap: '28%',
          data: list.map((item) => Number(item.cnt) || 0),
          itemStyle: { color: CHART_BLUE },
          label: {
            show: true,
            position: 'top',
            color: '#8c8c9e',
            fontSize: 15,
          },
        },
      ],
    };
  }, [data]);

  return <EChart height={700} option={option} loading={loading} zoomOnMouseWheel={false} />;
}
