import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';

echarts.use([
  BarChart,
  HeatmapChart,
  LineChart,
  GraphicComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export const CHART_BLUE = '#0068c9';
export const CHART_RED = '#f5222d';
const AXIS_GRAY = '#8c8c8c';

export interface EChartClickParams<T> {
  componentType: string;
  data: T;
  dataIndex: number;
  seriesIndex: number;
}

export type ToolboxFeature =
  | 'saveAsImage'
  | 'dataZoom'
  | 'zoomIn'
  | 'zoomOut'
  | 'magicType'
  | 'restore'
  | 'fullScreen';

interface EChartProps {
  option: EChartsCoreOption;
  height?: number;
  loading?: boolean;
  onEvents?: Record<string, (params: unknown, chart: echarts.ECharts) => void>;
  features?: ToolboxFeature[];
  toolboxOnHover?: boolean;
  zoomOnMouseWheel?: boolean;
  // 词云等非坐标系图表：不注入坐标轴/网格/缩放等默认配置
  bare?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

const DEFAULT_FEATURES: ToolboxFeature[] = [
  'saveAsImage',
  'dataZoom',
  'zoomIn',
  'zoomOut',
  'magicType',
  'restore',
  'fullScreen',
];

const PALETTE = [
  CHART_BLUE,
  CHART_RED,
  '#faad14',
  '#52c41a',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
  '#a0d911',
  '#2f54eb',
];

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  return Object.prototype.toString.call(val) === '[object Object]';
};

// 页面 option 优先、默认配置兜底；数组按位合并（如双 Y 轴场景）
const deepMerge = (base: unknown, override: unknown): unknown => {
  if (Array.isArray(override)) {
    const template = Array.isArray(base) ? base : [base];
    return override.map((item, index) => {
      return deepMerge(template[index] ?? template[0] ?? {}, item);
    });
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const key of Object.keys(override)) {
      result[key] = deepMerge(base[key], override[key]);
    }
    return result;
  }
  return override === undefined ? base : override;
};

const svgIcon = (paths: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${paths}</svg>`;
  return `image://data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const iconStroke = `fill="none" stroke="#8c8c8c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
const ZOOM_IN_ICON = svgIcon(`<path d="M8 4v8M4 8h8" ${iconStroke} />`);
const ZOOM_OUT_ICON = svgIcon(`<path d="M4 8h8" ${iconStroke} />`);
const FULLSCREEN_ICON = svgIcon(
  `<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" ${iconStroke} />`,
);
const EXIT_FULLSCREEN_ICON = svgIcon(
  `<path d="M6 2.5V6H2.5M10 2.5V6h3.5M10 13.5V10h3.5M6 13.5V10H2.5" ${iconStroke} />`,
);

interface ToolboxHandlers {
  zoomBy: (ratio: number) => void;
  toggleFullScreen: () => void;
  isFullScreen: boolean;
}

interface LegendEventParams {
  componentType?: string;
  name?: string;
  value?: string;
  event?: {
    event?: MouseEvent;
  };
}

const getLegendEventParams = (params: unknown): LegendEventParams | undefined => {
  if (!params || typeof params !== 'object') return undefined;
  const eventParams = params as LegendEventParams;
  return eventParams.componentType === 'legend' ? eventParams : undefined;
};

const buildFeature = (
  features: ToolboxFeature[],
  imageName: string,
  handlers: ToolboxHandlers,
): Record<string, unknown> => {
  const feature: Record<string, unknown> = {};
  if (features.includes('saveAsImage')) {
    feature.saveAsImage = {
      title: '保存为图片',
      name: imageName,
      backgroundColor: '#fff',
      excludeComponents: ['toolbox'],
    };
  }
  if (features.includes('dataZoom')) {
    feature.dataZoom = {
      title: { zoom: '区域缩放', back: '还原缩放' },
      xAxisIndex: 0,
      yAxisIndex: false,
    };
  }
  if (features.includes('zoomIn')) {
    feature.myZoomIn = {
      show: true,
      title: '放大',
      icon: ZOOM_IN_ICON,
      onclick: () => handlers.zoomBy(0.8),
    };
  }
  if (features.includes('zoomOut')) {
    feature.myZoomOut = {
      show: true,
      title: '缩小',
      icon: ZOOM_OUT_ICON,
      onclick: () => handlers.zoomBy(1.25),
    };
  }
  if (features.includes('magicType')) {
    feature.magicType = {
      type: ['bar', 'line'],
      title: { bar: '切换为柱状图', line: '切换为折线图' },
    };
  }
  if (features.includes('restore')) {
    feature.restore = { title: '还原' };
  }
  if (features.includes('fullScreen')) {
    feature.myFullScreen = {
      show: true,
      title: handlers.isFullScreen ? '退出全屏' : '全屏',
      icon: handlers.isFullScreen ? EXIT_FULLSCREEN_ICON : FULLSCREEN_ICON,
      onclick: handlers.toggleFullScreen,
    };
  }
  return feature;
};

const EChart: FC<EChartProps> = ({
  option,
  height = 420,
  loading = false,
  onEvents,
  features = DEFAULT_FEATURES,
  toolboxOnHover = false,
  zoomOnMouseWheel = true,
  bare = false,
  header,
  footer,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const zoomBy = (ratio: number) => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    const current = chart.getOption() as {
      dataZoom?: { start?: number; end?: number }[];
    };
    const dataZoom = current.dataZoom?.[0];
    if (!dataZoom) return;
    const oldStart = dataZoom.start ?? 0;
    const oldEnd = dataZoom.end ?? 100;
    const oldRange = oldEnd - oldStart;
    const newRange = Math.min(100, Math.max(5, oldRange * ratio));
    const center = (oldStart + oldEnd) / 2;
    let start = center - newRange / 2;
    let end = center + newRange / 2;
    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > 100) {
      start -= end - 100;
      end = 100;
    }
    chart.dispatchAction({
      type: 'dataZoom',
      start: Math.max(0, start),
      end: Math.min(100, end),
    });
  };

  const toggleFullScreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement === wrapRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const setToolboxVisible = (visible: boolean) => {
    const chart = chartInstanceRef.current;
    if (!toolboxOnHover || !chart || !features.length) return;
    chart.setOption({ toolbox: { show: visible } });
  };

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
    chartInstanceRef.current = chart;

    const resize = () => chart.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return;
    const titleText = (option.title as { text?: string } | undefined)?.text;
    const toolbox = {
      show: !toolboxOnHover,
      right: 20,
      top: 14,
      itemSize: 16,
      itemGap: 16,
      iconStyle: { borderColor: AXIS_GRAY },
      emphasis: { iconStyle: { borderColor: CHART_BLUE } },
      feature: buildFeature(features, titleText || 'chart', {
        zoomBy,
        toggleFullScreen,
        isFullScreen,
      }),
    };
    const baseOption = bare
      ? {
          toolbox: { ...toolbox, top: 8 },
          animationDuration: 600,
        }
      : {
          color: PALETTE,
          title: {
            left: 20,
            top: 16,
            textStyle: {
              fontSize: 16,
              fontWeight: 600,
              color: 'rgba(0,0,0,.85)',
            },
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#fff',
            borderColor: '#f0f0f0',
            borderWidth: 1,
            padding: [6, 10],
            textStyle: { color: 'rgba(0,0,0,.85)', fontSize: 12 },
            extraCssText: 'box-shadow:0 2px 8px rgba(0,0,0,.12);border-radius:6px;',
          },
          toolbox,
          grid: {
            left: 12,
            right: 24,
            top: option.title ? 64 : 28,
            bottom: 16,
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#d9d9d9' } },
            axisLabel: { color: AXIS_GRAY },
            nameTextStyle: { color: AXIS_GRAY },
          },
          yAxis: {
            type: 'value',
            axisTick: { show: false },
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
            axisLabel: { color: AXIS_GRAY },
            nameTextStyle: { color: AXIS_GRAY },
          },
          dataZoom: [
            {
              type: 'inside',
              xAxisIndex: 0,
              filterMode: 'filter',
              zoomOnMouseWheel,
              moveOnMouseWheel: false,
              moveOnMouseMove: false,
            },
          ],
          animationDuration: 600,
        };
    const base = { ...baseOption } as Record<string, unknown>;
    if (!features.length) {
      base.toolbox = { show: false };
    }
    if (option.dataZoom) {
      delete base.dataZoom;
    }
    const mergedOption = deepMerge(base, option) as Record<string, unknown>;
    if (Array.isArray(mergedOption.legend)) {
      mergedOption.legend = mergedOption.legend.map((legend) =>
        isPlainObject(legend) ? { ...legend, triggerEvent: true } : legend,
      );
    } else if (isPlainObject(mergedOption.legend)) {
      mergedOption.legend = { ...mergedOption.legend, triggerEvent: true };
    }
    const merged = mergedOption as EChartsCoreOption;
    if (!zoomOnMouseWheel && merged.dataZoom) {
      const dataZoomOptions = Array.isArray(merged.dataZoom) ? merged.dataZoom : [merged.dataZoom];
      merged.dataZoom = dataZoomOptions.map((dataZoomOption) => ({
        ...dataZoomOption,
        zoomOnMouseWheel: false,
      }));
    }
    chart.setOption(merged, { notMerge: true });
  }, [option, features, bare, toolboxOnHover, zoomOnMouseWheel, isFullScreen]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return;
    if (loading) {
      chart.showLoading({
        maskColor: 'rgba(255,255,255,.65)',
        color: CHART_BLUE,
        textColor: AXIS_GRAY,
      });
    } else {
      chart.hideLoading();
    }
  }, [loading]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return;

    const hasLegend = Boolean(chart.getOption().legend);
    const handleLegendFocus = (params: unknown) => {
      const eventParams = getLegendEventParams(params);
      const name = eventParams?.name ?? eventParams?.value;
      if (!name) return;

      const eventType = eventParams?.event?.event;
      if (eventType?.type === 'click' && !eventType.ctrlKey) return;
      if (eventType?.type !== 'dblclick' && !eventType?.ctrlKey) return;

      const chartOption = chart.getOption();
      const seriesList = Array.isArray(chartOption.series)
        ? chartOption.series
        : chartOption.series
        ? [chartOption.series]
        : [];
      const seriesNames = seriesList
        .map((series) => series.name)
        .filter((seriesName): seriesName is string => Boolean(seriesName));

      for (const seriesName of seriesNames) {
        chart.dispatchAction({
          type: seriesName === name ? 'legendSelect' : 'legendUnSelect',
          name: seriesName,
        });
      }
    };

    const listeners: { eventName: string; listener: (params: unknown) => void }[] = [];
    if (hasLegend) {
      for (const eventName of ['click', 'dblclick']) {
        chart.on(eventName, handleLegendFocus);
        listeners.push({ eventName, listener: handleLegendFocus });
      }
    }
    for (const [eventName, handler] of Object.entries(onEvents ?? {})) {
      const listener = (params: unknown) => handler(params, chart);
      chart.on(eventName, listener);
      listeners.push({ eventName, listener });
    }
    return () => {
      // 卸载时 init effect 的清理已先 dispose 实例，跳过对已销毁实例的 off 调用
      if (chart.isDisposed()) return;
      for (const { eventName, listener } of listeners) {
        chart.off(eventName, listener);
      }
    };
  }, [onEvents, option]);

  return (
    <div
      ref={wrapRef}
      style={{
        border: bare ? '1px solid #d9d9d9' : '1px solid #ececec',
        borderRadius: bare ? 6 : 8,
        backgroundColor: '#fff',
        padding: bare ? '8px 12px 4px' : '8px 8px 4px',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setToolboxVisible(true)}
      onMouseLeave={() => setToolboxVisible(false)}
    >
      {header ? <div style={{ padding: '12px 20px 0' }}>{header}</div> : null}
      <div ref={chartRef} style={{ width: '100%', height }} />
      {footer ? <div style={{ padding: '0 20px 14px' }}>{footer}</div> : null}
    </div>
  );
};

export default EChart;
