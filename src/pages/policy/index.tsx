import type { GetPolicyRes } from '@/services/modules/policy';
import { deletePolicy, getPolicyAll } from '@/services/modules/policy';
import { completeImgUrl } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, message } from 'antd';
import { useRef, useState } from 'react';
import Add from './component/Add';

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deletePolicy(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetPolicyRes>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={false}
        search={false}
        toolBarRender={() => [<Add key="add" reload={actionRef.current?.reload} />]}
        request={() => {
          return getPolicyAll().then((res) => {
            return {
              success: true,
              data: res,
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
            title: '版本',
            dataIndex: 'version',
            search: false,
          },
          {
            align: 'center',
            title: '隐私协议',
            search: false,
            dataIndex: 'privacypolixy',
            render: (_, record) => {
              const link = completeImgUrl(record.privacypolicy as string);
              return record.privacypolicy ? (
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              ) : (
                '--'
              );
            },
          },
          {
            align: 'center',
            title: '用户协议',
            search: false,
            dataIndex: 'userpolicy',
            render: (_, record) => {
              const link = completeImgUrl(record.userpolicy as string);
              return record.userpolicy ? (
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              ) : (
                '--'
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
