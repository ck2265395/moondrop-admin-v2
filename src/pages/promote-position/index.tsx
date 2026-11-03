import type { GetPromotePositionRes } from '@/services/modules/promote-position';
import { deletePromotePosition, getPromotePositionAll } from '@/services/modules/promote-position';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';
import Add from './component/Add';

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deletePromotePosition(uuid)
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
      <ProTable<GetPromotePositionRes>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={false}
        toolBarRender={() => [<Add key="add" reload={() => actionRef.current?.reload()} />]}
        request={(params) => {
          return getPromotePositionAll().then((res) => {
            const title = String(params.title ?? '')
              .trim()
              .toLowerCase();
            const code = String(params.code ?? '')
              .trim()
              .toLowerCase();
            const data = res.filter((item) => {
              const matchesTitle = !title || item.title.toLowerCase().includes(title);
              const matchesCode = !code || item.code.toLowerCase().includes(code);
              return matchesTitle && matchesCode;
            });

            return {
              success: true,
              data,
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
            title: '标题',
            dataIndex: 'title',
          },
          {
            align: 'center',
            title: 'CODE',
            dataIndex: 'code',
          },
          {
            align: 'center',
            title: '描述',
            search: false,
            dataIndex: 'desc',
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
                    reload={() => actionRef.current?.reload()}
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
