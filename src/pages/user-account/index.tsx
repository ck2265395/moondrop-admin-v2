import EChart from '@/components/EChart';
import UuidCell from '@/components/UuidCell';
import type { GetUserRes } from '@/services/modules/user';
import {
  deleteUser,
  getUser,
  getUserPermissionDict,
  getUserStatistics,
  patchUser,
  postAdminUser,
} from '@/services/modules/user';
import { completeImgUrl } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
  const { data: permissionDict } = useRequest(getUserPermissionDict);
  const [permissionTarget, setPermissionTarget] = useState<GetUserRes | null>(null);
  const [permissionValues, setPermissionValues] = useState<string[]>([]);
  const [savePermissionsLoading, setSavePermissionsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GetUserRes | null>(null);

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

  const handleDelete = (record: GetUserRes) => {
    setDeleteLoading((prev) => ({ ...prev, [record.uuid]: true }));
    deleteUser(record.uuid)
      .then(() => {
        message.success('删除成功');
        setDeleteTarget(null);
        refreshStatistics();
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [record.uuid]: false }));
      });
  };

  const handleSavePermissions = () => {
    if (!permissionTarget) return;
    setSavePermissionsLoading(true);
    patchUser({ permissions: permissionValues }, permissionTarget.uuid)
      .then(() => {
        message.success('操作成功');
        setPermissionTarget(null);
        actionRef.current?.reload();
      })
      .finally(() => {
        setSavePermissionsLoading(false);
      });
  };

  // ===== 后台新建用户（开发测试用） =====
  const [createForm] = Form.useForm();
  const [createVisible, setCreateVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreateUser = async () => {
    const values = await createForm.validateFields();
    setCreateLoading(true);
    postAdminUser({
      username: values.username,
      email: values.email,
      password: values.password,
      phone: values.phone,
      status: values.status ?? 1,
      permissions: values.permissions,
    })
      .then(() => {
        message.success('创建成功');
        setCreateVisible(false);
        createForm.resetFields();
        refreshStatistics();
        actionRef.current?.reload();
      })
      .finally(() => {
        setCreateLoading(false);
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
        toolBarRender={() => [
          <Tooltip key="create" title="新建用户（开发测试用）">
            <Button
              type="text"
              icon={
                <PlusOutlined
                  style={{ color: '#8c8c8c', fontSize: 16, fontWeight: 700, strokeWidth: 40 }}
                />
              }
              onClick={() => setCreateVisible(true)}
            />
          </Tooltip>,
        ]}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        request={(param) => {
          const { current, pageSize, uuid, username, email, phone, permissions } = param;
          return getUser({
            pageSize,
            pageIndex: current,
            uuid,
            username,
            email,
            phone,
            permissions: permissions?.length ? permissions.join(',') : undefined,
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
            align: 'left',
            title: '权限',
            dataIndex: 'permissions',
            valueType: 'select',
            fieldProps: {
              mode: 'multiple',
              allowClear: true,
              placeholder: '请选择权限（多选取交集）',
              options: Object.entries(permissionDict || {}).map(([key, text]) => ({
                value: key,
                label: text,
              })),
            },
            width: 160,
            render: (_, record) =>
              (record.permissions || []).length ? (
                (record.permissions || []).map((key) => (
                  <Tag key={key} color="blue">
                    {permissionDict?.[key] || key}
                  </Tag>
                ))
              ) : (
                '--'
              ),
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
            width: 180,
            render: (_, record) => {
              return (
                <Space direction="horizontal">
                  <Button
                    onClick={() => {
                      setPermissionTarget(record);
                      setPermissionValues(record.permissions || []);
                    }}
                  >
                    权限
                  </Button>
                  <Button
                    type="primary"
                    danger
                    loading={deleteLoading[record.uuid]}
                    onClick={() => setDeleteTarget(record)}
                  >
                    删除
                  </Button>
                </Space>
              );
            },
          },
        ]}
      />
      <Modal
        title="删除用户"
        open={!!deleteTarget}
        okText="删除"
        okButtonProps={{ danger: true, loading: deleteTarget ? !!deleteLoading[deleteTarget.uuid] : false }}
        onOk={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>
          确定删除用户「{deleteTarget?.username}」
          {deleteTarget?.nickname ? `（${deleteTarget.nickname}）` : ''}吗？
        </p>
        <p style={{ color: '#ff4d4f' }}>删除后该用户的所有数据将不可恢复，请谨慎操作。</p>
      </Modal>
      <Drawer
        title={`编辑权限${permissionTarget ? `：${permissionTarget.username}` : ''}`}
        width={480}
        open={!!permissionTarget}
        onClose={() => setPermissionTarget(null)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPermissionTarget(null)}>取消</Button>
              <Button type="primary" loading={savePermissionsLoading} onClick={handleSavePermissions}>
                保存
              </Button>
            </Space>
          </div>
        }
      >
        {permissionTarget && (
          <>
            <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
              用户：{permissionTarget.email}
            </p>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择权限"
              value={permissionValues}
              onChange={setPermissionValues}
              options={Object.entries(permissionDict || {}).map(([key, text]) => ({
                value: key,
                label: text,
              }))}
            />
          </>
        )}
      </Drawer>
      <Modal
        title="新建用户（开发测试用）"
        open={createVisible}
        okText="创建"
        okButtonProps={{ loading: createLoading }}
        onOk={handleCreateUser}
        onCancel={() => {
          setCreateVisible(false);
          createForm.resetFields();
        }}
      >
        <Form form={createForm} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input maxLength={30} placeholder="用户名（唯一）" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input maxLength={30} placeholder="邮箱（唯一）" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password maxLength={30} placeholder="登录密码" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input maxLength={20} placeholder="选填" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 1, label: '启用' },
                { value: 0, label: '禁用' },
              ]}
            />
          </Form.Item>
          <Form.Item name="permissions" label="权限">
            <Select
              mode="multiple"
              allowClear
              placeholder="选填"
              options={Object.entries(permissionDict || {}).map(([key, text]) => ({
                value: key,
                label: text,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
