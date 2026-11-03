import type { GetWallpaperPageReq, GetWallpaperRes } from '@/services/modules/wallpaper';
import { deleteWallpaper, getWallpaperPage } from '@/services/modules/wallpaper';
import { pageToTable, tablePagination } from '@/utils/table';
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
    deleteWallpaper(uuid)
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
      <ProTable<GetWallpaperRes, GetWallpaperPageReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={{ ...tablePagination, defaultPageSize: 10 }}
        toolBarRender={() => [<Add key="add" reload={() => actionRef.current?.reload()} />]}
        request={(params) =>
          getWallpaperPage({
            title: params.title,
            pageIndex: params.current,
            pageSize: params.pageSize,
          }).then(pageToTable)
        }
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
            title: '备注',
            search: false,
            dataIndex: 'desc',
          },
          {
            align: 'center',
            title: '创建时间',
            dataIndex: 'createTime',
            width: 160,
            search: false,
            valueType: 'dateTime',
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
