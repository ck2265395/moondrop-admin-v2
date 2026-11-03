import FileUpload from '@/components/FileUpload';
import UuidCell from '@/components/UuidCell';
import type {
  GetFreqResponseAdminAllReq,
  GetFreqResponseAdminAllRes,
  PostFreqResponseAdminReq,
} from '@/services/modules/freq-response-admin';
import {
  deleteFreqResponseAdmin,
  getFreqResponseAdminAll,
  patchFreqResponseAdmin,
  postFreqResponseAdmin,
} from '@/services/modules/freq-response-admin';
import { pageToTable, renderIndex, tablePagination } from '@/utils/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DrawerForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';

const TYPE_OPTIONS = [
  { label: 'ORIGINAL', value: 'ORIGINAL' },
  { label: 'TARGET', value: 'TARGET' },
];

const EditModel = ({
  data,
  reload,
}: {
  data?: GetFreqResponseAdminAllRes;
  reload?: () => void;
}) => {
  const { md } = Grid.useBreakpoint();
  const { runAsync: postRun } = useRequest(postFreqResponseAdmin, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchFreqResponseAdmin, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const [form] = Form.useForm<Omit<PostFreqResponseAdminReq, 'file'> & { file?: string[] }>();

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={data ? '编辑频响曲线' : '新建频响曲线'}
      trigger={
        <Button type="primary" icon={data ? <EditOutlined /> : <PlusOutlined />}>
          {data ? '编辑' : '新建'}
        </Button>
      }
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({
            title: data.title,
            file: [data.file],
            type: data.type,
          });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload = { ...values, file: values.file?.[0] } as PostFreqResponseAdminReq;
        // 编辑时把原 userUuid 带上，避免 TypeORM update 置 NULL
        if (data) {
          payload.userUuid = data.userUuid;
        }
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
      initialValues={data ? { title: data.title, file: [data.file], type: data.type } : {}}
    >
      <ProFormText name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]} />
      <Form.Item
        name="file"
        label="文件"
        rules={[{ required: true, type: 'array', message: '请选择文件' }]}
      >
        <FileUpload fileGroup="freq-response-file" ext={['.txt']} />
      </Form.Item>
      <ProFormSelect
        name="type"
        label="类型"
        options={TYPE_OPTIONS}
        rules={[{ required: true, message: '请选择类型' }]}
      />
      {!data && (
        <ProFormText
          name="userUuid"
          label="用户UUID"
          rules={[{ required: true, message: '请输入用户UUID' }]}
        />
      )}
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteFreqResponseAdmin(uuid)
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
      <ProTable<GetFreqResponseAdminAllRes, GetFreqResponseAdminAllReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
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
          getFreqResponseAdminAll({
            pageIndex: params.current,
            pageSize: params.pageSize,
            title: params.title,
            type: params.type,
          }).then(pageToTable)
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            width: 80,
            search: false,
            render: renderIndex,
          },
          {
            align: 'center',
            title: 'UUID',
            key: 'uuid',
            search: false,
            width: 220,
            render: (_, record) => <UuidCell uuid={record.uuid} />,
          },
          {
            align: 'left',
            title: '标题',
            dataIndex: 'title',
            width: 240,
            render: (_, record) => (
              <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {record.title}
              </span>
            ),
          },
          {
            align: 'center',
            title: '文件',
            dataIndex: 'file',
            ellipsis: true,
            search: false,
          },
          {
            align: 'center',
            title: '类型',
            dataIndex: 'type',
            valueType: 'select',
            valueEnum: {
              ORIGINAL: { text: 'ORIGINAL' },
              TARGET: { text: 'TARGET' },
            },
          },
          {
            align: 'center',
            title: '用户',
            dataIndex: 'username',
            ellipsis: true,
            search: false,
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
                  onConfirm={() => handleDelete(record.uuid)}
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
