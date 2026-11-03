import type { GetAnnouncementRes } from '@/services/modules/announcement';
import {
  deleteAnnouncement,
  getAnnouncementAll,
  patchAnnouncement,
} from '@/services/modules/announcement';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Switch } from 'antd';
import { useRef, useState } from 'react';
import Add from './component/Add';

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handlePatch = (opt: { status: 0 | 1 }, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchAnnouncement(opt, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setPatchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteAnnouncement(uuid)
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
      <ProTable<GetAnnouncementRes>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={false}
        toolBarRender={() => [<Add key="add" reload={actionRef.current?.reload} />]}
        request={() => {
          return getAnnouncementAll().then((res) => {
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
            title: '标题',
            search: false,
            dataIndex: 'title',
          },
          {
            align: 'center',
            title: '内容',
            search: false,
            dataIndex: 'content',
            width: 300,
            render: (val) => {
              return (
                <span
                  style={{
                    whiteSpace: 'pre-line',
                  }}
                >
                  {val}
                </span>
              );
            },
          },
          {
            align: 'center',
            title: '发布时间',
            valueType: 'dateTime',
            dataIndex: 'publishTime',
            search: false,
          },
          {
            align: 'center',
            title: '上线/下线',
            dataIndex: 'status',
            search: false,
            render: (val, record) => {
              return (
                <Switch
                  checkedChildren="上线"
                  unCheckedChildren="下线"
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
        search={false}
      />
    </PageContainer>
  );
};
