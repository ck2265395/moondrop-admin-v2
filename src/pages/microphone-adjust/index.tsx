import FileUpload from '@/components/FileUpload';
import ProductSelect from '@/components/Selects/ProductSelect';
import type {
  GetMicrophoneAdjustReq,
  GetMicrophoneAdjustRes,
  PostMicrophoneAdjustReq,
} from '@/services/modules/microphone-adjust';
import {
  deleteMicrophoneAdjust,
  getMicrophoneAdjustAll,
  patchMicrophoneAdjust,
  postMicrophoneAdjust,
} from '@/services/modules/microphone-adjust';
import { pageToTable, renderFileLink, renderIndex, tablePagination } from '@/utils/table';
import { getProductModelName } from '@/utils/utils';
import { DrawerForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';

const label = '麦克风校准文件';

interface MicrophoneAdjusFormData extends Omit<PostMicrophoneAdjustReq, 'file'> {
  file: string[];
}

const EditRef = ({ data, reload }: { data?: GetMicrophoneAdjustRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<MicrophoneAdjusFormData>();
  const { runAsync: postRun } = useRequest(postMicrophoneAdjust, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchMicrophoneAdjust, {
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
      title={data ? `编辑${label}` : `新建${label}`}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 460 : '100%', maskClosable: false, getContainer: undefined }}
      // initialValues={{ status: true, type: RefType.USER }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({ ...data, file: data.file ? [data.file] : [] });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload = { ...values, file: values.file?.[0] } as PostMicrophoneAdjustReq;
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText name="snCode" label="SN码" rules={[{ required: true, message: '请输入' }]} />
      <Form.Item
        name="productUuid"
        label="所属产品"
        rules={[{ required: true, message: '请选择' }]}
      >
        <ProductSelect placeholder="请选择" style={{ maxWidth: '100%' }} />
      </Form.Item>

      <Form.Item
        name="file"
        label="文件"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="microphone-adjust" ext={['.txt', '.json']} />
      </Form.Item>
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteMicrophoneAdjust(uuid)
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
      <ProTable<GetMicrophoneAdjustRes, GetMicrophoneAdjustReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [<EditRef key="add" reload={() => actionRef.current?.reload()} />]}
        request={(params) =>
          getMicrophoneAdjustAll({
            pageIndex: params.current,
            pageSize: params.pageSize,
            snCode: params.snCode,
            productUuid: params.productUuid,
            file: params.file,
          }).then(pageToTable)
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '所属产品',
            dataIndex: 'productUuid',
            hideInTable: true,
            renderFormItem: () => <ProductSelect placeholder="请选择" style={{ width: '100%' }} />,
          },
          {
            align: 'center',
            title: '序号',
            key: 'index',
            search: false,
            width: 80,
            render: renderIndex,
          },
          { align: 'center', title: 'SN码', dataIndex: 'snCode' },
          {
            align: 'center',
            title: '所属产品',
            dataIndex: 'product',
            render: (_, record) =>
              record.product?.model
                ? getProductModelName(record.product.model, record.product.name)
                : '-',
            hideInTable: false,
            search: false,
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
                <EditRef data={record} reload={() => actionRef.current?.reload()} />
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
