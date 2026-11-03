import { ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Radio } from 'antd';
import type { EChartsCoreOption } from 'echarts/core';
import { useEffect, useMemo, useState } from 'react';

import type { EChartClickParams } from '@/components/EChart';
import EChart from '@/components/EChart';
import {
  getFeedbackAll,
  getStatistics,
  type GetFeedbackRes,
  type GetStatisticsRes,
  Latitude,
  ProblemTypeLabel,
} from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';
import './DeviceCompatibility.less';

export enum ShowTab {
  brand = 1, // 手机品牌
  model = 2, // 手机型号
  list = 3, // 型号反馈
}

const CHART_CFG = {
  [ShowTab.brand]: {
    xField: 'brand',
    xTitle: '手机品牌',
  },
  [ShowTab.model]: {
    xField: 'phone_model',
    xTitle: '手机型号',
  },
} as const;

interface StackPoint {
  value: number;
  raw?: GetStatisticsRes;
  count: number;
  total: number;
  category: string;
}

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

enum DisplayMode {
  COUNT = 'count',
  PERCENT = 'percent',
}

export default function DeviceCompatibility() {
  const { searchParams, pagination, latitude, setPagination } = usePageContext();
  const [showLabel, setShowLabel] = useState<{ label: number; brand: string; model: string }>({
    label: ShowTab.brand,
    brand: '',
    model: '',
  });
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.COUNT);

  const statiscRequest = useRequest(getStatistics, { manual: true });
  const listRequest = useRequest(getFeedbackAll, { manual: true });

  const params = useMemo(() => {
    const qyeryParams = {
      ...searchParams,
    };

    if (showLabel.label > ShowTab.brand && showLabel.brand) {
      qyeryParams.brand = showLabel.brand;
    }
    if (showLabel.label === ShowTab.list) {
      delete qyeryParams.latitude;
      delete qyeryParams.brand;
      qyeryParams.phone_model = `${showLabel.brand}${showLabel.model}`;
    }

    return qyeryParams;
  }, [searchParams, showLabel, pagination.current, latitude]);

  useEffect(() => {
    if (!params.product_uuid) {
      return;
    }

    if (showLabel.label !== ShowTab.list) {
      statiscRequest.run({
        ...params,
        latitude: Latitude.DEVICE_COMPATIBILITY,
      });
    } else {
      listRequest.run({
        ...params,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
      });
    }
  }, [params]);

  const { data, loading } = statiscRequest;
  const { data: listRes, loading: listLoading } = listRequest;

  // 产品名直接从统计数据派生，避免在渲染阶段 setState
  const proName = data?.[0]?.product_name ?? '';

  const chartTitle = `设备兼容性（产品型号：${proName}）${
    showLabel.brand ? ` - ${showLabel.brand}机型分布` : ''
  }`;

  const option = useMemo<EChartsCoreOption>(() => {
    const list = data ?? [];
    const cfg =
      showLabel.label === ShowTab.brand ? CHART_CFG[ShowTab.brand] : CHART_CFG[ShowTab.model];
    const categoryList: string[] = [];
    const typeList: string[] = [];
    const cellMap = new Map<string, { sum: number; raw: GetStatisticsRes }>();
    const totalMap = new Map<string, number>();

    for (const row of list) {
      const category = row[cfg.xField] || '未知';
      const type = ProblemTypeLabel[row.problemType ?? ''] ?? row.problemType ?? '其他';
      if (!categoryList.includes(category)) categoryList.push(category);
      if (!typeList.includes(type)) typeList.push(type);

      const cnt = Number(row.cnt) || 0;
      const key = `${category}__${type}`;
      const cell = cellMap.get(key);
      if (cell) {
        cell.sum += cnt;
      } else {
        cellMap.set(key, { sum: cnt, raw: row });
      }
      totalMap.set(category, (totalMap.get(category) ?? 0) + cnt);
    }

    // 按堆叠总量倒序，与原 G2 sort(reverse by y) 一致
    const sortedCategories = categoryList.sort((a, b) => {
      return (totalMap.get(b) ?? 0) - (totalMap.get(a) ?? 0);
    });

    const chartOption: EChartsCoreOption = {
      title: { text: chartTitle },
      xAxis: {
        name: cfg.xTitle,
        nameLocation: 'middle',
        nameGap: 58,
        data: sortedCategories,
        axisLabel: { rotate: 40, interval: 0 },
      },
      yAxis: {
        name: displayMode === DisplayMode.COUNT ? '反馈条数' : '堆叠百分比',
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 42,
        max: displayMode === DisplayMode.PERCENT ? 100 : undefined,
        axisLabel:
          displayMode === DisplayMode.PERCENT
            ? { formatter: (value: number) => `${value}%` }
            : undefined,
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        align: 'left',
        right: 8,
        top: 92,
        bottom: 20,
        textStyle: { color: '#595959' },
      },
      graphic: [
        {
          type: 'text',
          right: 82,
          top: 66,
          style: {
            text: '问题类型',
            fill: '#8c8c9e',
            fontSize: 12,
          },
        },
      ],
      grid: { left: 56, right: 140, bottom: 90, containLabel: true },
      tooltip: {
        trigger: 'item',
        className: 'device-compatibility-tooltip',
        backgroundColor: '#fff',
        borderColor: '#d9d9d9',
        borderWidth: 1,
        padding: [4, 6],
        textStyle: { color: '#8c8c9e', fontSize: 14 },
        extraCssText: 'box-shadow:none;border-radius:0;',
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
        formatter: (tooltipParams: unknown) => {
          if (!tooltipParams || typeof tooltipParams !== 'object') return '';
          const item = tooltipParams as Record<string, unknown>;
          const point = item.data as StackPoint | undefined;
          if (!point) return '';

          const categoryLabel = showLabel.label === ShowTab.brand ? '手机品牌' : '手机型号';
          const plotLabel =
            displayMode === DisplayMode.COUNT
              ? `数量=${point.count}`
              : `百分比=${Number(point.value).toFixed(1)}%`;
          return `<div class="device-compatibility-tooltip__content">
            <div>问题类别=${escapeHtml(`${item.seriesName ?? ''}`)}</div>
            <div>${categoryLabel}=${escapeHtml(point.category)}</div>
            <div>${plotLabel}</div>
          </div>`;
        },
      },
      series: typeList.map((type) => {
        return {
          name: type,
          type: 'bar',
          stack: 'total',
          barCategoryGap: '35%',
          ...(type === typeList[typeList.length - 1]
            ? {
                label: {
                  show: true,
                  position: 'top',
                  color: '#8c8c9e',
                  formatter: (labelParams: { data?: StackPoint }) =>
                    (labelParams.data?.total ?? 0) > 0
                      ? displayMode === DisplayMode.COUNT
                        ? `${labelParams.data?.total}`
                        : '100%'
                      : '',
                },
              }
            : {}),
          data: sortedCategories.map((category) => {
            const cell = cellMap.get(`${category}__${type}`);
            const total = totalMap.get(category) ?? 0;
            const count = cell?.sum ?? 0;
            return {
              value:
                displayMode === DisplayMode.COUNT ? count : total > 0 ? (count / total) * 100 : 0,
              count,
              total,
              category,
              raw: cell?.raw,
            } as StackPoint;
          }),
        };
      }),
    };

    return chartOption;
  }, [chartTitle, data, displayMode, showLabel.label]);

  const onEvents = useMemo(() => {
    return {
      click: (clickParams: unknown) => {
        const p = clickParams as EChartClickParams<StackPoint>;
        if (p.componentType !== 'series') return;
        const raw = p.data?.raw;
        if (raw?.product_uuid && raw.brand) {
          setShowLabel((prev) => {
            const next = {
              label: prev.label + 1,
              brand: raw.brand ?? '',
              model: '',
            };
            if (next.label === ShowTab.list) {
              next.model = `${raw.phone_model ?? ''}`;
            }
            return next;
          });
        }
      },
    };
  }, []);

  // 同步分页总数（须通过 setPagination，避免在 useMemo 中直接改 state）
  useEffect(() => {
    setPagination((prev) => {
      const total = listRes?.total ?? 0;
      if (prev.total === total) {
        return prev;
      }

      return {
        ...prev,
        total,
      };
    });
  }, [listRes, setPagination]);

  // 加载产品问题列表
  const listData = useMemo(() => listRes?.list ?? [], [listRes]);

  return (
    <>
      {!searchParams.product_uuid ? (
        <div className="device-compatibility__empty">
          <div className="device-compatibility__empty-message">
            请在筛选区域「产品型号」中选择单一型号后再查看设备兼容性。
          </div>
        </div>
      ) : (
        <>
          <>
            {showLabel.label > 1 && (
              <>
                <Button
                  type="default"
                  onClick={() => {
                    setShowLabel({ label: ShowTab.brand, brand: '', model: '' });
                  }}
                >
                  返回手机品牌
                </Button>

                {showLabel.label > 2 && (
                  <Button
                    type="default"
                    onClick={() => {
                      setShowLabel({
                        label: ShowTab.model,
                        brand: showLabel.brand,
                        model: showLabel.model,
                      });
                    }}
                  >
                    返回型号分步
                  </Button>
                )}
              </>
            )}
            <br />
          </>
          {showLabel.label === ShowTab.list ? (
            <>
              <>
                {`${showLabel.brand} / ${showLabel.model}`} - 问题详情
                <ProTable<GetFeedbackRes>
                  loading={listLoading}
                  rowKey="uuid"
                  dataSource={listData}
                  pagination={{
                    ...pagination,

                    onChange: (page: number, pageSize: number) => {
                      setPagination((prev) => ({
                        ...prev,
                        current: page,
                        pageSize,
                      }));
                    },
                  }}
                  search={false}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      align: 'center',
                      title: '序号',
                      key: 'index',
                      width: 80,
                      render: (val, row, index) => {
                        return index + 1;
                      },
                    },
                    {
                      align: 'center',
                      title: '用户名',
                      dataIndex: 'username',
                    },
                    // {
                    //   align: 'center',
                    //   title: '产品型号',
                    //   render: (_, record) =>
                    //     record.product ? `${record.product.model} ${record.product.name ?? ''}` : '--',
                    // },
                    {
                      align: 'center',
                      title: '设备型号',
                      dataIndex: 'devicemodel',
                    },
                    {
                      align: 'center',
                      title: '固件版本号',
                      dataIndex: 'otaversion',
                    },
                    {
                      align: 'center',
                      title: 'APP版本号',
                      dataIndex: 'appversion',
                    },
                    {
                      align: 'left',
                      title: '内容',
                      dataIndex: 'content',
                      width: 400,
                      render: (_, record) => {
                        const content = record.content || '';
                        if (!content) return '--';
                        return (
                          <span style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                            {content}
                          </span>
                        );
                      },
                    },
                    {
                      align: 'center',
                      title: '问题类型',
                      dataIndex: 'problemType',
                      render: (_, record) => {
                        return (
                          ProblemTypeLabel[record.problemType ?? ''] ||
                          record.problemType ||
                          '--'
                        );
                      },
                    },
                    {
                      align: 'center',
                      title: '发布时间',
                      valueType: 'dateTime',
                      dataIndex: 'publishTime',
                    },
                  ]}
                />
              </>
            </>
          ) : (
            <EChart
              option={option}
              loading={loading}
              onEvents={onEvents}
              header={
                <div className="device-compatibility__header">
                  <Radio.Group
                    value={displayMode}
                    onChange={(event) => setDisplayMode(event.target.value)}
                  >
                    <Radio value={DisplayMode.COUNT}>绝对条数</Radio>
                    <Radio value={DisplayMode.PERCENT}>堆叠百分比（各型号合计100%）</Radio>
                  </Radio.Group>
                  <div className="device-compatibility__hint">
                    点击柱状图中某一
                    {showLabel.label === ShowTab.brand ? '手机品牌' : '手机型号'}柱子，可下钻查看
                    {showLabel.label === ShowTab.brand
                      ? '该品牌下的「机型分布」图'
                      : '「问题详情」数据表'}
                    。
                  </div>
                </div>
              }
              height={660}
              toolboxOnHover
              zoomOnMouseWheel={false}
              // 切换层级时分类轴数据整体替换，强制重建避免堆叠序列残留
              key={showLabel.label}
            />
          )}
        </>
      )}
    </>
  );
}
