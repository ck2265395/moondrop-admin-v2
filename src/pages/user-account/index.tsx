import EChart from '@/components/EChart';
import UuidCell from '@/components/UuidCell';
import type { GetUserRes } from '@/services/modules/user';
import { deleteUser, getUser, getUserStatistics, patchUser } from '@/services/modules/user';
import { completeImgUrl } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Card, Col, Popconfirm, Row, Space, Statistic, Switch, message } from 'antd';
import type { EChartsCoreOption } from 'echarts/core';
import { useMemo, useRef, useState } from 'react';

// 手机号脱敏：保留前 3 后 4 位
const maskPhone = (phone?: string | null): string => {
  if (!phone) return '';
  if (phone.length <= 7) return `${phone.slice(0, 1)}****`;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const {
    data: statistics,
    loading: statisticsLoading,
    refresh: refreshStatistics,
  } = useRequest(getUserStatistics);

  const registrationTrendOption = useMemo<EChartsCoreOption>(
    () => ({
      title: { text: '近 30 日新增用户' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: statistics?.registrationTrend.map((item) => item.date.slice(5)) ?? [],
        axisLabel: { color: '#8c8c8c' },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        name: '新增用户',
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 38,
      },
      grid: { left: 36, right: 24, top: 56, bottom: 24, containLabel: true },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: statistics?.registrationTrend.map((item) => item.count) ?? [],
          lineStyle: { width: 2, color: '#0068c9' },
          areaStyle: { opacity: 0.12, color: '#0068c9' },
        },
      ],
    }),
    [statistics],
  );

  const handlePatch = (opt: { status: number }, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchUser(opt, uuid)
      .then(() => {
        message.success('操作成功');
        refreshStatistics();
        actionRef.current?.reload();
      })
      .finally(() => {
        setPatchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteUser(uuid)
      .then(() => {
        message.success('删除成功');
        refreshStatistics();
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          {
            title: '用户总数',
            value: statistics?.total ?? 0,
          },
          {
            title: '今日新增',
            value: statistics?.todayNew ?? 0,
          },
          {
            title: '昨日新增',
            value: statistics?.yesterdayNew ?? 0,
          },
          {
            title: '近 7 日新增',
            value: statistics?.last7DaysNew ?? 0,
          },
          {
            title: '近 30 日新增',
            value: statistics?.last30DaysNew ?? 0,
          },
        ].map((item) => (
          <Col key={item.title} xs={12} sm={8} lg={6} xl={3}>
            <Card
              variant="outlined"
              style={{ borderColor: '#f0f0f0', borderRadius: 8 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Statistic
                title={item.title}
                value={item.value}
                loading={statisticsLoading}
                valueStyle={{ color: '#262626', fontSize: 26, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
        <Col span={24}>
          <Card loading={statisticsLoading} styles={{ body: { padding: '8px 16px' } }}>
            <EChart
              height={320}
              option={registrationTrendOption}
              loading={statisticsLoading}
              features={[
                'saveAsImage',
                'dataZoom',
                'zoomIn',
                'zoomOut',
                'magicType',
                'restore',
                'fullScreen',
              ]}
            />
          </Card>
        </Col>
      </Row>
      <ProTable<GetUserRes>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        request={(param) => {
          const { current, pageSize, uuid, username, email, phone } = param;
          return getUser({
            pageSize,
            pageIndex: current,
            uuid,
            username,
            email,
            phone,
          }).then((res) => {
            return {
              success: true,
              data: res.list,
              total: res.total,
            };
          });
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            search: false,
            width: 100,
            render: (_, __, index) => index + 1,
          },
          {
            align: 'center',
            title: 'UUID',
            dataIndex: 'uuid',
            width: 220,
            render: (_, record) => <UuidCell uuid={record.uuid} />,
          },
          {
            align: 'center',
            title: '头像',
            dataIndex: 'profilepic',
            search: false,
            render: (_, record) => {
              if (!record.profilepic) return '';
              return (
                <img
                  src={completeImgUrl(record.profilepic)}
                  width={40}
                  height={40}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.textContent = '-';
                  }}
                />
              );
            },
          },
          {
            align: 'left',
            title: '用户名',
            dataIndex: 'username',
          },
          {
            align: 'left',
            title: '邮箱',
            dataIndex: 'email',
          },
          {
            align: 'left',
            title: '手机号',
            dataIndex: 'phone',
            render: (_, record) => maskPhone(record.phone) || '--',
          },
          {
            align: 'center',
            title: '添加时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            search: false,
          },
          {
            align: 'center',
            title: '最后登录时间',
            dataIndex: 'latestLoginTime',
            valueType: 'dateTime',
            search: false,
          },
          {
            align: 'left',
            title: 'IP',
            dataIndex: 'ip',
            search: false,
            width: 200,
            render: (_, record) => {
              if (!record.ip) return '';
              const region = (record.region ?? '')
                .split('|')
                .filter((item) => item && item !== '0')
                .join(' ');
              return (
                <div>
                  <div>{record.ip}</div>
                  {region && <div style={{ color: '#8c8c8c', fontSize: 12 }}>{region}</div>}
                </div>
              );
            },
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            search: false,
            render: (val, record) => {
              return (
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  checked={!!val}
                  loading={patchLoading[record.uuid]}
                  onChange={() => {
                    handlePatch(
                      {
                        status: val === 0 ? 1 : 0,
                      },
                      record.uuid,
                    );
                  }}
                />
              );
            },
          },
          {
            align: 'center',
            title: '操作',
            key: 'option',
            valueType: 'option',
            width: 120,
            render: (_, record) => {
              return (
                <Space direction="horizontal">
                  <Popconfirm
                    title="确定删除吗?"
                    okButtonProps={{ loading: deleteLoading[record.uuid] }}
                    onConfirm={() => {
                      handleDelete(record.uuid);
                    }}
                  >
                    <Button type="primary" danger loading={deleteLoading[record.uuid]}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />
    </PageContainer>
  );
};
