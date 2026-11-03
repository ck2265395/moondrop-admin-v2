import { ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Typography } from 'antd';
import type { EChartsCoreOption } from 'echarts/core';
import { useEffect, useMemo, useState } from 'react';

import type { EChartClickParams } from '@/components/EChart';
import EChart, { CHART_BLUE } from '@/components/EChart';
import {
  getFeedbackAll,
  getStatistics,
  type GetFeedbackRes,
  Latitude,
  ProblemTypeLabel,
} from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';

interface ProductBarDatum {
  cnt: number;
  product_name: string;
  product_uuid: string;
}

interface ProductBarPoint {
  value: number;
  raw: ProductBarDatum;
}

export default function Product() {
  const { searchParams, pagination, setPagination } = usePageContext();
  const [showSts, setShowSts] = useState(true);
  const [listPUuid, setListPUuid] = useState('');
  const [currProduct, setCurrProduct] = useState('');

  const statiscRequest = useRequest(getStatistics, { manual: true });
  const listRequest = useRequest(getFeedbackAll, { manual: true });
  useEffect(() => {
    if (showSts) {
      delete searchParams.product_uuid;
      statiscRequest.run({
        ...searchParams,
        latitude: Latitude.PRODUCT,
      });
    } else {
      listRequest.run({
        ...searchParams,
        product_uuid: listPUuid,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
      });
    }
  }, [showSts, searchParams, pagination.current]);

  const { data, loading } = statiscRequest;
  const { data: listRes, loading: listLoading } = listRequest;

  const configData = useMemo(() => {
    const collectData: ProductBarDatum[] = [];
    for (const i of data ?? []) {
      if (!i.product_uuid) continue;
      collectData.push({
        cnt: Number(i.cnt) || 0,
        product_name: i.product_name || i.product_uuid,
        product_uuid: i.product_uuid,
      });
    }
    return collectData.sort((a, b) => b.cnt - a.cnt);
  }, [data]);

  const option = useMemo<EChartsCoreOption>(() => {
    return {
      title: { text: '产品型号分布' },
      xAxis: {
        name: '产品型号',
        nameLocation: 'middle',
        nameGap: 112,
        data: configData.map((item) => item.product_name),
        axisLabel: { rotate: 40, interval: 0, margin: 12, fontSize: 10 },
      },
      yAxis: {
        name: '反馈条数',
        nameLocation: 'middle',
        nameGap: 44,
        minInterval: 1,
      },
      grid: { left: 42, right: 28, top: 80, bottom: 95, containLabel: true },
      series: [
        {
          type: 'bar',
          barCategoryGap: '20%',
          data: configData.map((item) => {
            return { value: item.cnt, raw: item } as ProductBarPoint;
          }),
          itemStyle: { color: CHART_BLUE },
          label: {
            show: true,
            position: 'top',
            color: '#8c8c9e',
            fontSize: 9,
          },
        },
      ],
    };
  }, [configData]);

  const onEvents = useMemo(() => {
    return {
      click: (params: unknown) => {
        const p = params as EChartClickParams<ProductBarPoint>;
        if (p.componentType !== 'series') return;
        const raw = p.data?.raw;
        if (raw?.product_uuid) {
          setListPUuid(raw.product_uuid);
          setCurrProduct(raw.product_name);
          setShowSts(false);
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
      {showSts ? (
        <EChart
          height={700}
          option={option}
          loading={loading}
          zoomOnMouseWheel={false}
          onEvents={onEvents}
          header={
            <div style={{ color: '#8c8c9e', fontSize: 13 }}>
              点击柱状图中某一产品型号柱子，可下钻查看「问题明细」数据表。
            </div>
          }
        />
      ) : (
        <div
          style={{
            padding: 16,
            border: '1px solid #ececec',
            borderRadius: 8,
            backgroundColor: '#fff',
          }}
          className="product-feedback-detail"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Button
              type="default"
              onClick={() => {
                setShowSts((prev) => !prev);
              }}
            >
              返回产品型号分布
            </Button>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {currProduct} - 问题明细
            </Typography.Title>
          </div>
          <ProTable<GetFeedbackRes>
            cardProps={false}
            loading={listLoading}
            rowKey="uuid"
            dataSource={listData}
            options={false}
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
            toolBarRender={false}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                align: 'center',
                title: '序号',
                key: 'index',
                width: 60,
                render: (_, __, index) => {
                  return index + 1;
                },
              },
              {
                align: 'left',
                title: '用户名',
                dataIndex: 'username',
                width: 100,
              },
              // {
              //   align: 'left',
              //   title: '产品型号',
              //   render: (_, record) =>
              //     record.product ? `${record.product.model} ${record.product.name ?? ''}` : '--',
              // },
              {
                align: 'left',
                title: '设备型号',
                dataIndex: 'devicemodel',
                width: 120,
              },
              {
                align: 'left',
                title: '固件版本号',
                dataIndex: 'otaversion',
                width: 120,
              },
              {
                align: 'left',
                title: 'APP版本号',
                dataIndex: 'appversion',
                width: 100,
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
                    <span
                      style={{
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                      }}
                    >
                      {content}
                    </span>
                  );
                },
              },
              {
                align: 'left',
                title: '问题类型',
                dataIndex: 'problemType',
                width: 140,
                render: (_, record) => {
                  return (
                    ProblemTypeLabel[record.problemType ?? ''] || record.problemType || '--'
                  );
                },
              },
              {
                align: 'center',
                title: '发布时间',
                valueType: 'dateTime',
                dataIndex: 'publishTime',
                width: 140,
              },
            ]}
          />
        </div>
      )}
    </>
  );
}
