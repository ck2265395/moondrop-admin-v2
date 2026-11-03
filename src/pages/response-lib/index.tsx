import FileUpload from '@/components/FileUpload';
import UuidCell from '@/components/UuidCell';
import type { GetResponseLibRes, PostResponseLibReq } from '@/services/modules/response-lib';
import {
  deleteResponseLib,
  getResponseLibAll,
  patchResponseLib,
  postResponseLib,
} from '@/services/modules/response-lib';
import { getResponseLibTagsAll, postResponseLibTags } from '@/services/modules/response-lib-tags';
import { listToTable, renderFileLink, renderIndex } from '@/utils/table';
import { DrawerForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space, Tag } from 'antd';
import { useRef, useState } from 'react';

interface ResponseLibFormData extends Omit<PostResponseLibReq, 'file'> {
  file: string[];
}

const EditResponseLib = ({ data, reload }: { data?: GetResponseLibRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<ResponseLibFormData>();
  const { runAsync: postRun } = useRequest(postResponseLib, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchResponseLib, {
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
      title={data ? '编辑频响库' : '新建频响库'}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 420 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({ name: data.name, file: data.file ? [data.file] : [] });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload = { name: values.name, file: values.file?.[0] };
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText name="name" label="名称" rules={[{ required: true, message: '请输入' }]} />
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

const EditTags = ({ record, reload }: { record: GetResponseLibRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<{ tags: string[] }>();
  const { run: loadTags } = useRequest(
    () => getResponseLibTagsAll({ responseLibUuid: record.uuid }),
    {
      manual: true,
      onSuccess: (res) => {
        form.setFieldsValue({ tags: res.map((item) => item.name) });
      },
    },
  );
  const { runAsync: postRun } = useRequest(postResponseLibTags, {
    manual: true,
    onSuccess: () => {
      message.success('保存成功');
      reload?.();
    },
  });

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={`编辑标签：${record.name}`}
      trigger={<Button>标签</Button>}
      drawerProps={{ width: md ? 420 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible) {
          loadTags();
        } else {
          form.resetFields();
        }
      }}
      onFinish={(values) =>
        postRun({
          responseLibUuid: record.uuid,
          responseLibTags: (values.tags ?? []).map((name: string) => ({ name })),
        })
          .then(() => true)
          .catch(() => false)
      }
    >
      <ProFormSelect
        name="tags"
        label="标签"
        fieldProps={{ mode: 'tags', tokenSeparators: [',', '，'] }}
      />
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteResponseLib(uuid)
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
      <ProTable<GetResponseLibRes>
        actionRef={actionRef}
        rowKey="uuid"
        search={false}
        pagination={false}
        toolBarRender={() => [
          <EditResponseLib key="add" reload={() => actionRef.current?.reload()} />,
        ]}
        request={() => getResponseLibAll().then(listToTable)}
        scroll={{ x: 'max-content' }}
        columns={[
          { align: 'center', title: '序号', key: 'index', width: 80, render: renderIndex },
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
          {
            align: 'left',
            title: '文件',
            dataIndex: 'file',
            render: (_, record) => renderFileLink(record.file),
          },
          {
            align: 'left',
            title: '标签',
            dataIndex: 'tags',
            render: (_, record) => record.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 190,
            render: (_, record) => (
              <Space>
                <EditTags record={record} reload={() => actionRef.current?.reload()} />
                <EditResponseLib data={record} reload={() => actionRef.current?.reload()} />
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
