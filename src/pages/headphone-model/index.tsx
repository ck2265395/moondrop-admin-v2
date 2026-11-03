import type {
  GetHeadphoneModelAdminAllReq,
  GetHeadphoneModelAdminAllRes,
  PostHeadphoneModelAdminReq,
} from '@/services/modules/headphone-model-admin';
import {
  deleteHeadphoneModelAdmin,
  getHeadphoneModelAdminAll,
  patchHeadphoneModelAdmin,
  postHeadphoneModelAdmin,
} from '@/services/modules/headphone-model-admin';
import { listToTable, renderIndex } from '@/utils/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DrawerForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';

const EditModel = ({
  data,
  reload,
}: {
  data?: GetHeadphoneModelAdminAllRes;
  reload?: () => void;
}) => {
  const { md } = Grid.useBreakpoint();
  const { runAsync: postRun } = useRequest(postHeadphoneModelAdmin, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchHeadphoneModelAdmin, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const [form] = Form.useForm<{ title: string }>();

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={data ? '编辑耳机型号' : '新建耳机型号'}
      trigger={
        <Button type="primary" icon={data ? <EditOutlined /> : <PlusOutlined />}>
          {data ? '编辑' : '新建'}
        </Button>
      }
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({ title: data.title });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values: PostHeadphoneModelAdminReq) => {
        const request = data ? patchRun(values, data.uuid) : postRun(values);
        return request.then(() => true).catch(() => false);
      }}
      initialValues={data ? { title: data.title } : {}}
    >
      <ProFormText name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]} />
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const { runAsync: deleteRunAsync } = useRequest(deleteHeadphoneModelAdmin, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });
  const deleteRun = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    return deleteRunAsync(uuid)
      .catch(() => undefined)
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetHeadphoneModelAdminAllRes, GetHeadphoneModelAdminAllReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={false}
        search={{
          optionRender: (searchConfig) => [
            <Button
              key="reset"
              icon={<ReloadOutlined />}
              onClick={() => searchConfig?.form?.resetFields?.()}
            >
              重置
            </Button>,
            <Button
              key="submit"
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => searchConfig?.form?.submit?.()}
            >
              查询
            </Button>,
          ],
        }}
        toolBarRender={() => [<EditModel key="add" reload={() => actionRef.current?.reload()} />]}
        request={(params) =>
          getHeadphoneModelAdminAll({
            title: params.title,
          }).then(listToTable)
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            width: 80,
            fixed: 'left',
            search: false,
            render: renderIndex,
          },
          {
            align: 'center',
            title: '标题',
            dataIndex: 'title',
          },
          {
            align: 'center',
            title: '创建时间',
            dataIndex: 'createTime',
            // width: 160,
            search: false,
            valueType: 'dateTime',
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 180,
            render: (_, record) => (
              <Space size={4}>
                <EditModel data={record} reload={() => actionRef.current?.reload()} />
                <Popconfirm
                  title="确定删除吗?"
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => deleteRun(record.uuid)}
                >
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteLoading[record.uuid]}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};
