import type { AdminAuditReq, GetAdminRes, PatchAdminReq } from '@/services/modules/admin';
import { getAdmin, patchAdmin, patchAdminAudit } from '@/services/modules/admin';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Input, message, Modal, Popconfirm, Radio, Space, Switch, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Add from './component/Add';
import UpdatePassword from './component/UpdatePassword';

const STATUS_TAG_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '禁用', color: 'red' },
  1: { text: '启用', color: 'green' },
  2: { text: '待审核', color: 'gold' },
  3: { text: '已驳回', color: 'volcano' },
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [switchLoading, setSwitchLoading] = useState<Record<string, boolean>>({});
  const [auditLoading, setAuditLoading] = useState(false);

  const statusFilterRef = useRef(true);
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [rejectRecord, setRejectRecord] = useState<GetAdminRes>();
  const [rejectRemark, setRejectRemark] = useState('');

  const handlePatch = (opt: PatchAdminReq, uuid: string) => {
    setSwitchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchAdmin(opt, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setSwitchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const handleAudit = (opt: AdminAuditReq, uuid: string) => {
    setAuditLoading(true);
    return patchAdminAudit(opt, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setAuditLoading(false);
      });
  };

  // 状态筛选变化后重新拉取（跳过首次渲染，避免重复请求）
  useEffect(() => {
    if (statusFilterRef.current) {
      statusFilterRef.current = false;
      return;
    }
    actionRef.current?.reload();
  }, [statusFilter]);

  const closeRejectModal = () => {
    setRejectRecord(undefined);
    setRejectRemark('');
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          optionType="button"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: '全部', value: '' },
            { label: '待审核', value: 2 },
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
            { label: '已驳回', value: 3 },
          ]}
        />
      </div>
      <ProTable<GetAdminRes>
        actionRef={actionRef}
        rowKey="uuid"
        columnsState={{
          defaultValue: {
            casdoorUsername: { show: false },
            casdoorRoles: { show: false },
            latestLoginTime: { show: false },
          },
        }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        toolBarRender={() => [<Add key="add" reload={() => actionRef.current?.reload()} />]}
        request={(param) => {
          const { current, pageSize } = param;
          return getAdmin({
            pageSize,
            pageIndex: current,
            status: statusFilter === '' ? undefined : statusFilter,
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
            width: 80,
            render: (val, row, index) => {
              return index + 1;
            },
          },
          {
            align: 'center',
            title: '用户名',
            search: false,
            dataIndex: 'username',
          },
          {
            align: 'center',
            title: '头像',
            search: false,
            dataIndex: 'casdoorAvatar',
            width: 80,
            render: (_, record) => {
              if (!record.casdoorAvatar) {
                return '-';
              }
              return (
                <img
                  src={record.casdoorAvatar}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
              );
            },
          },
          {
            align: 'center',
            title: '登录方式',
            key: 'loginType',
            search: false,
            width: 90,
            render: (_, record) => {
              return record.casdoorUsername ? <Tag color="blue">Casdoor</Tag> : <Tag>密码</Tag>;
            },
          },
          {
            align: 'center',
            title: '姓名',
            dataIndex: 'name',
            search: false,
          },
          {
            align: 'center',
            title: 'Casdoor 账号名',
            dataIndex: 'casdoorUsername',
            search: false,
          },
          {
            align: 'center',
            title: '组织',
            dataIndex: 'casdoorOrg',
            search: false,
            render: (val) => val || '-',
          },
          {
            align: 'center',
            title: '公司',
            dataIndex: 'company',
            search: false,
            render: (val) => val || '-',
          },
          {
            align: 'center',
            title: '部门',
            dataIndex: 'department',
            search: false,
            render: (val) => val || '-',
          },
          {
            align: 'center',
            title: 'Casdoor 角色',
            dataIndex: 'casdoorRoles',
            search: false,
            render: (_, record) => {
              if (!record.casdoorRoles) {
                return '-';
              }
              return (
                <Space direction="horizontal" wrap>
                  {record.casdoorRoles.split(',').map((role) => (
                    <Tag key={role} color="blue">
                      {role}
                    </Tag>
                  ))}
                </Space>
              );
            },
          },
          {
            align: 'center',
            title: '邮箱',
            dataIndex: 'casdoorEmail',
            search: false,
          },
          {
            align: 'center',
            title: '手机号',
            dataIndex: 'mobile',
            search: false,
          },
          {
            align: 'center',
            title: '职位',
            dataIndex: 'job',
            search: false,
          },
          {
            align: 'center',
            title: '审核备注',
            dataIndex: 'auditRemark',
            search: false,
            render: (val) => val || null,
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
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            width: 120,
            search: false,
            render: (_, record) => {
              if (record.status === 1 || record.status === 0) {
                return (
                  <Switch
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                    checked={record.status === 1}
                    loading={switchLoading[record.uuid]}
                    onChange={() => {
                      handlePatch(
                        {
                          status: record.status === 1 ? 0 : 1,
                        },
                        record.uuid,
                      );
                    }}
                  />
                );
              }
              const tag = STATUS_TAG_MAP[record.status];
              return tag ? <Tag color={tag.color}>{tag.text}</Tag> : '-';
            },
          },
          {
            align: 'left',
            title: '操作',
            key: 'option',
            valueType: 'option',
            width: 160,
            render: (_, record) => {
              if (record.status === 2) {
                return (
                  <Space direction="horizontal" size={12}>
                    <Popconfirm
                      title="确认通过该管理员的审核申请？"
                      onConfirm={() => handleAudit({ status: 1 }, record.uuid)}
                    >
                      <Button type="primary">通过</Button>
                    </Popconfirm>
                    <Button type="primary" danger onClick={() => setRejectRecord(record)}>
                      驳回
                    </Button>
                  </Space>
                );
              }
              return (
                <Space direction="horizontal" size={12}>
                  <Add
                    reload={() => actionRef.current?.reload()}
                    data={{
                      ...record,
                    }}
                  />
                  {!record.casdoorUsername && (
                    <UpdatePassword
                      reload={() => actionRef.current?.reload()}
                      data={{
                        ...record,
                      }}
                    />
                  )}
                </Space>
              );
            },
          },
        ]}
        search={false}
      />
      <Modal
        title="驳回审核申请"
        open={!!rejectRecord}
        confirmLoading={auditLoading}
        onCancel={closeRejectModal}
        onOk={() => {
          if (!rejectRecord) {
            return;
          }
          const remark = rejectRemark.trim();
          if (!remark) {
            message.warning('请填写驳回原因');
            return;
          }
          handleAudit({ status: 3, remark }, rejectRecord.uuid)
            .then(closeRejectModal)
            .catch(() => {});
        }}
      >
        <Input.TextArea
          rows={3}
          maxLength={200}
          showCount
          value={rejectRemark}
          placeholder="请填写驳回原因"
          onChange={(e) => setRejectRemark(e.target.value)}
        />
      </Modal>
    </PageContainer>
  );
};
