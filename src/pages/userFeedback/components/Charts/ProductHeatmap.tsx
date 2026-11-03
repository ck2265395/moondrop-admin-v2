import { useRequest } from 'ahooks';
import { Radio, Slider } from 'antd';
import type { EChartsCoreOption } from 'echarts/core';
import { useMemo, useState } from 'react';

import EChart from '@/components/EChart';
import {
  getStatistics,
  Latitude,
  ProblemTypeLabel,
  ProblemTypes,
} from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';
import './ProductHeatmap.less';

const DEFAULT_PRODUCT_LIMIT = 22;
const CELL_COLORS = ['#fff8f4', '#fee3d8', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#99000d'];
const CHART_HEIGHT = 760;
const VISUAL_MAP_HEIGHT = 520;
const VISUAL_MAP_BOTTOM = 155;
const VISUAL_MAP_WIDTH = 28;
const VISUAL_MAP_RIGHT = 40;
const VISUAL_MAP_TITLE_WIDTH = 56;

export enum GranularityType {
  QUANTITY = 1,
  PROPORTIONAL = 2,
}

interface ProductHeatmapDatum {
  name: string;
  total: number;
  counts: Map<string, number>;
}

interface HeatmapCell {
  value: [number, number, number];
  productName: string;
  problemLabel: string;
  count: number;
  ratio: number;
}

const normalizeProblemType = (type?: string) =>
  ProblemTypes.some((item) => item.value === type) ? type! : 'other';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });

export default function ProductHeatmap() {
  const { searchParams } = usePageContext();
  const [granularity, setGranularity] = useState<GranularityType>(GranularityType.PROPORTIONAL);
  const [productLimit, setProductLimit] = useState(DEFAULT_PRODUCT_LIMIT);

  const params = useMemo(
    () => ({
      ...searchParams,
      latitude: Latitude.PRODUCT_HEATMAP,
    }),
    [searchParams],
  );

  const { data, loading } = useRequest(() => getStatistics(params), {
    refreshDeps: [params],
  });

  const products = useMemo<ProductHeatmapDatum[]>(() => {
    const productMap = new Map<string, ProductHeatmapDatum>();
    for (const item of data ?? []) {
      const name = item.product_name || item.product_uuid || '未知产品';
      const problemType = normalizeProblemType(item.problemType);
      const product = productMap.get(name) ?? {
        name,
        total: 0,
        counts: new Map<string, number>(),
      };
      const count = Number(item.cnt) || 0;
      product.total += count;
      product.counts.set(problemType, (product.counts.get(problemType) ?? 0) + count);
      productMap.set(name, product);
    }
    return [...productMap.values()].sort((a, b) => b.total - a.total);
  }, [data]);

  const visibleProducts = useMemo(
    () => products.slice(0, Math.min(productLimit, products.length)),
    [products, productLimit],
  );

  const heatmapCells = useMemo<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = [];
    visibleProducts.forEach((product, productIndex) => {
      ProblemTypes.forEach((problemType, problemIndex) => {
        const count = product.counts.get(problemType.value) ?? 0;
        cells.push({
          value: [
            problemIndex,
            productIndex,
            granularity === GranularityType.QUANTITY
              ? count
              : product.total > 0
              ? count / product.total
              : 0,
          ],
          productName: product.name,
          problemLabel: ProblemTypeLabel[problemType.value] ?? problemType.label,
          count,
          ratio: product.total > 0 ? count / product.total : 0,
        });
      });
    });
    return cells;
  }, [visibleProducts, granularity]);

  const maxValue =
    granularity === GranularityType.PROPORTIONAL
      ? 1
      : Math.max(1, ...heatmapCells.map((cell) => cell.count));
  const visualMapTop = CHART_HEIGHT - VISUAL_MAP_BOTTOM - VISUAL_MAP_HEIGHT;
  const visualMapTicks =
    granularity === GranularityType.PROPORTIONAL ? [1, 0.8, 0.6, 0.4, 0.2, 0] : [maxValue, 0];
  const sliderMax = Math.max(1, products.length);
  const sliderValue = Math.min(productLimit, sliderMax);
  const sliderPercent = sliderMax > 1 ? ((sliderValue - 1) / (sliderMax - 1)) * 100 : 50;

  const option = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 300,
      title: {
        text: `产品问题热力图（${
          granularity === GranularityType.PROPORTIONAL ? '归一化比例' : '绝对频次'
        }）`,
      },
      toolbox: { top: 0 },
      grid: { left: 100, right: 96, top: 64, bottom: 96, containLabel: true },
      tooltip: {
        trigger: 'item',
        className: 'product-heatmap-tooltip',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
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
        extraCssText: 'overflow:visible;box-shadow:none;border:0;border-radius:0;',
        formatter: (tooltipParams: unknown) => {
          if (!tooltipParams || typeof tooltipParams !== 'object' || !('data' in tooltipParams))
            return '';
          const cell = (tooltipParams as { data?: HeatmapCell }).data;
          if (!cell) return '';
          return `<div class="product-heatmap-tooltip__content">
            <div>产品型号：${escapeHtml(cell.productName)}</div>
            <div>问题类型：${escapeHtml(cell.problemLabel)}</div>
            <div>${
              granularity === GranularityType.QUANTITY
                ? `条数：${cell.count}`
                : `占该型号：${(cell.ratio * 100).toFixed(1)}%`
            }</div>
          </div>`;
        },
      },
      xAxis: {
        type: 'category',
        data: ProblemTypes.map((item) => ProblemTypeLabel[item.value] ?? item.label),
        name: '问题类型',
        nameLocation: 'middle',
        nameGap: 66,
        axisLabel: { rotate: 40, interval: 0, color: '#8c8c9e', fontSize: 10 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        splitArea: { show: true, areaStyle: { color: ['#fff', '#fff'] } },
      },
      yAxis: {
        type: 'category',
        data: visibleProducts.map((item) => item.name),
        inverse: true,
        name: '产品型号',
        nameLocation: 'middle',
        nameGap: 150,
        axisLabel: { color: '#8c8c9e', fontSize: 10 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      visualMap: {
        type: 'continuous',
        show: false,
        min: 0,
        max: maxValue,
        calculable: false,
        orient: 'vertical',
        right: VISUAL_MAP_RIGHT,
        bottom: VISUAL_MAP_BOTTOM,
        itemWidth: VISUAL_MAP_WIDTH,
        itemHeight: VISUAL_MAP_HEIGHT,
        inRange: { color: CELL_COLORS },
      },
      graphic: [
        {
          type: 'rect',
          right: 50,
          top: visualMapTop,
          shape: { width: VISUAL_MAP_WIDTH, height: VISUAL_MAP_HEIGHT, r: 2 },
          style: {
            fill: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [...CELL_COLORS].reverse().map((color, index, colors) => ({
                offset: index / (colors.length - 1),
                color,
              })),
            },
            stroke: '#8c8c8c',
            lineWidth: 1,
          },
          silent: true,
          z: 10,
        },
        {
          type: 'text',
          right: VISUAL_MAP_RIGHT + VISUAL_MAP_WIDTH / 2 - VISUAL_MAP_TITLE_WIDTH / 2 - 5,
          top: Math.max(8, visualMapTop - 28),
          style: {
            text: granularity === GranularityType.PROPORTIONAL ? '型号内占比' : '反馈条数',
            fill: '#8c8c9e',
            fontSize: 12,
            textAlign: 'center',
            width: VISUAL_MAP_TITLE_WIDTH,
          },
          silent: true,
          z: 10,
        },
        ...visualMapTicks.map((value) => {
          const ratio = maxValue > 0 ? value / maxValue : 0;
          return {
            type: 'text' as const,
            right: VISUAL_MAP_RIGHT - 8,
            top: visualMapTop + VISUAL_MAP_HEIGHT * (1 - ratio) - 6,
            style: {
              text: `${value}`,
              fill: '#8c8c9e',
              fontSize: 10,
              textAlign: 'left' as const,
              textVerticalAlign: 'middle' as const,
            },
            silent: true,
            z: 10,
          };
        }),
      ],
      series: [
        {
          type: 'heatmap',
          data: heatmapCells,
          itemStyle: { borderWidth: 1, borderColor: '#fff' },
          emphasis: {
            itemStyle: { borderColor: '#555', borderWidth: 1 },
          },
        },
      ],
    }),
    [granularity, heatmapCells, maxValue, visibleProducts],
  );

  const chartHeader = (
    <div className="product-heatmap__header">
      <Radio.Group onChange={(event) => setGranularity(event.target.value)} value={granularity}>
        <Radio value={GranularityType.PROPORTIONAL}>
          归一化比例（该问题占该型号总反馈的比例，0~1）
        </Radio>
        <Radio value={GranularityType.QUANTITY}>绝对频次</Radio>
      </Radio.Group>
    </div>
  );

  return (
    <div className="product-heatmap">
      <div className="product-heatmap__limit">
        <div className="product-heatmap__limit-label">
          展示产品型号数量（按反馈条数取前若干型号）
        </div>
        <div className="product-heatmap__slider-wrap">
          <span className="product-heatmap__slider-value" style={{ left: `${sliderPercent}%` }}>
            {sliderValue}
          </span>
          <Slider
            className="product-heatmap__slider"
            min={1}
            max={sliderMax}
            value={sliderValue}
            marks={{
              1: '1',
              [sliderMax]: `${sliderMax}`,
            }}
            tooltip={{ open: false }}
            onChange={(value) => {
              setProductLimit(typeof value === 'number' ? value : value[0]);
            }}
          />
        </div>
      </div>
      <EChart
        height={CHART_HEIGHT}
        option={option}
        loading={loading}
        features={['saveAsImage', 'dataZoom', 'zoomIn', 'zoomOut', 'restore', 'fullScreen']}
        zoomOnMouseWheel={false}
        header={chartHeader}
      />
    </div>
  );
}
