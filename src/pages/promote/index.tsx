import type { GetPromoteReq, GetPromoteRes } from '@/services/modules/promote';
import { deletePromote, getPromote } from '@/services/modules/promote';
import { getPromotePositionAll } from '@/services/modules/promote-position';
import type { PromoteType } from '@/utils/data';
import { promoteType } from '@/utils/data';
import { pageToTable, tablePagination } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
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
    deletePromote(uuid)
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
      <ProTable<GetPromoteRes, GetPromoteReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [<Add key="add" reload={() => actionRef.current?.reload()} />]}
        request={(params) => {
          const { current, pageSize, promotePositionUuid } = params;
          return getPromote({
            pageIndex: current,
            pageSize,
            promotePositionUuid,
          }).then(pageToTable);
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '图片位',
            dataIndex: 'promotePositionUuid',
            hideInTable: true,
            request: () => {
              return getPromotePositionAll().then((res) => {
                return res.map((item) => {
                  return {
                    label: item.title,
                    value: item.uuid,
                  };
                });
              });
            },
          },
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
            search: false,
            dataIndex: 'title',
          },
          {
            align: 'center',
            title: '图片位',
            search: false,
            key: 'position',
            render: (val, record) => {
              return (
                <>
                  <div>{record.promotePosition?.title ?? '-'}</div>
                  <div>CODE: {record.promotePosition?.code ?? '-'}</div>
                </>
              );
            },
          },
          {
            align: 'center',
            title: '图片',
            search: false,
            dataIndex: 'img',
            render: (val) => {
              const src = completeImgUrl(val as string);
              return (
                <a target="_blank" href={src} rel="noreferrer">
                  <img src={src} height="100" onClick={() => {}} />
                </a>
              );
            },
          },
          {
            align: 'center',
            title: '跳转类型',
            search: false,
            dataIndex: 'type',
            render: (val) => {
              return <span>{promoteType[val as PromoteType]}</span>;
            },
          },
          {
            align: 'center',
            title: '跳转目标',
            search: false,
            dataIndex: 'target',
          },
          {
            align: 'center',
            title: '备注',
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
