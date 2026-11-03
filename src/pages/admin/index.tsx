import type { GetAdminRes, PatchAdminReq } from '@/services/modules/admin';
import { getAdmin, patchAdmin } from '@/services/modules/admin';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { message, Space, Switch, Tag } from 'antd';
import { useRef, useState } from 'react';
import Add from './component/Add';
import UpdatePassword from './component/UpdatePassword';

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [switchLoading, setSwitchLoading] = useState<Record<string, boolean>>({});

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

  return (
    <PageContainer>
      <ProTable<GetAdminRes>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        toolBarRender={() => [<Add key="add" reload={actionRef.current?.reload} />]}
        request={(param) => {
          const { current, pageSize } = param;
          return getAdmin({
            pageSize,
            pageIndex: current,
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
            search: false,
            render: (val, record) => {
              return (
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  checked={!!val}
                  loading={switchLoading[record.uuid]}
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
                  <Add
                    reload={actionRef.current?.reload}
                    data={{
                      ...record,
                    }}
                  />
                  <UpdatePassword
                    reload={actionRef.current?.reload}
                    data={{
                      ...record,
                    }}
                  />
                </Space>
              );
            },
          },
        ]}
        search={false}
      />
    </PageContainer>
  );
};
