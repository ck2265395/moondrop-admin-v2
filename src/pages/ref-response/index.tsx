import FileUpload from '@/components/FileUpload';
import UuidCell from '@/components/UuidCell';
import type {
  GetRefResponseReq,
  GetRefResponseRes,
  PostRefResponseReq,
} from '@/services/modules/ref-response';
import {
  deleteRefResponse,
  getRefResponseAll,
  patchRefResponse,
  postRefResponse,
  RefType,
} from '@/services/modules/ref-response';
import { pageToTable, renderFileLink, renderIndex, tablePagination } from '@/utils/table';
import { DrawerForm, PageContainer, ProFormSelect, ProFormSwitch, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space, Switch, Tag } from 'antd';
import { useRef, useState } from 'react';

interface RefFormData extends Omit<PostRefResponseReq, 'file'> {
  file: string[];
}

const typeOptions = [
  { label: '官方', value: RefType.OFFICIAL },
  { label: '精选', value: RefType.STAR },
  { label: '用户', value: RefType.USER },
];

const EditRef = ({ data, reload }: { data?: GetRefResponseRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<RefFormData>();
  const { runAsync: postRun } = useRequest(postRefResponse, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchRefResponse, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={data ? '编辑原始频响' : '新建原始频响'}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 460 : '100%', maskClosable: false, getContainer: undefined }}
      initialValues={{ status: true, type: RefType.USER }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({ ...data, file: data.file ? [data.file] : [] });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload = {
          ...values,
          file: values.file?.[0],
          tags: values.tags ?? [],
        } as PostRefResponseReq;
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText name="name" label="名称" rules={[{ required: true, message: '请输入' }]} />
      <ProFormSelect name="type" label="类型" options={typeOptions} />
      <ProFormSwitch name="status" label="状态" checkedChildren="启用" unCheckedChildren="禁用" />
      <ProFormText name="userUuid" label="用户 UUID" />
      <ProFormSelect
        name="tags"
        label="标签"
        fieldProps={{ mode: 'tags', tokenSeparators: [',', '，'] }}
      />
      <Form.Item
        name="file"
        label="文件"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="freq-response-file" ext={['.txt', '.json']} />
      </Form.Item>
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteRefResponse(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };
  const handlePatch = (status: boolean, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchRefResponse({ status }, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setPatchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetRefResponseRes, GetRefResponseReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [<EditRef key="add" reload={actionRef.current?.reload} />]}
        request={(params) =>
          getRefResponseAll({
            pageIndex: params.current,
            pageSize: params.pageSize,
            name: params.name,
            tagName: params.tagName,
            userUuid: params.userUuid,
            type: params.type,
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
            title: '名称',
            dataIndex: 'name',
            width: 240,
            render: (_, record) => (
              <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {record.name}
              </span>
            ),
          },
          { align: 'center', title: '标签', dataIndex: 'tagName', hideInTable: true },
          {
            align: 'center',
            title: '类型',
            dataIndex: 'type',
            valueEnum: { OFFICIAL: '官方', STAR: '精选', USER: '用户' },
          },
          {
            align: 'center',
            title: '文件',
            dataIndex: 'file',
            search: false,
            render: (_, record) => renderFileLink(record.file),
          },
          {
            align: 'center',
            title: '标签',
            dataIndex: 'tags',
            search: false,
            render: (_, record) => record.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>),
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            search: false,
            render: (val, record) => (
              <Switch
                checkedChildren="启用"
                unCheckedChildren="禁用"
                checked={!!val}
                loading={patchLoading[record.uuid]}
                onChange={() => handlePatch(!record.status, record.uuid)}
              />
            ),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 150,
            render: (_, record) => (
              <Space>
                <EditRef data={record} reload={actionRef.current?.reload} />
                <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.uuid)}>
                  <Button danger type="primary" loading={deleteLoading[record.uuid]}>
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
