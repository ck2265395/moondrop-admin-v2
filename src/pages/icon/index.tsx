import FileUpload from '@/components/FileUpload';
import type { GetIconReq, GetIconRes, PostIconReq } from '@/services/modules/icon';
import { deleteIcon, getIconIndex, patchIcon, postIcon } from '@/services/modules/icon';
import {
  pageToTable,
  renderFileLink,
  renderIndex,
  renderThumb,
  tablePagination,
} from '@/utils/table';
import { DrawerForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';

interface IconFormData extends Omit<PostIconReq, 'file'> {
  file: string[];
}

const EditIcon = ({ data, reload }: { data?: GetIconRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<IconFormData>();
  const { runAsync: postRun } = useRequest(postIcon, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchIcon, {
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
      title={data ? '编辑图标' : '新建图标'}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 420 : '100%', maskClosable: false, getContainer: undefined }}
      onOpenChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({
            name: data.name,
            file: data.file ? [data.file] : [],
          });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload = {
          name: values.name,
          file: values.file?.[0],
        };
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText name="name" label="名称" rules={[{ required: true, message: '请输入' }]} />
      <Form.Item
        name="file"
        label="图标文件"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="icon" ext={['.svg', '.png', '.jpg', '.jpeg']} />
      </Form.Item>
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteIcon(uuid)
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
      <ProTable<GetIconRes, GetIconReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [<EditIcon key="add" reload={() => actionRef.current?.reload()} />]}
        request={(params) =>
          getIconIndex({
            pageIndex: params.current,
            pageSize: params.pageSize,
            name: params.name,
            uuid: params.uuid,
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
          { align: 'center', title: '名称', dataIndex: 'name' },
          {
            align: 'center',
            title: '预览',
            dataIndex: 'file',
            search: false,
            render: (_, record) => renderThumb(record.file, 48),
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
            title: '操作',
            valueType: 'option',
            width: 150,
            render: (_, record) => (
              <Space>
                <EditIcon data={record} reload={() => actionRef.current?.reload()} />
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
