import type { GetProtocolV2Res, PostProtocolV2Req } from '@/services/modules/protocol-v2';
import {
  deleteProtocolV2,
  getProtocolV2All,
  patchProtocolV2,
  postProtocolV2,
} from '@/services/modules/protocol-v2';
import { listToTable, renderIndex } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
import {
  DrawerForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';

const EditProtocol = ({ data, reload }: { data?: GetProtocolV2Res; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<PostProtocolV2Req>();
  const { runAsync: postRun } = useRequest(postProtocolV2, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchProtocolV2, {
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
      title={data ? '编辑协议 V2' : '新建协议 V2'}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 640 : '100%', maskClosable: false, getContainer: undefined }}
      onOpenChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue(data);
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const request = data
          ? patchRun(values as PostProtocolV2Req, data.uuid)
          : postRun(values as PostProtocolV2Req);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText name="version" label="版本" rules={[{ required: true, message: '请输入' }]} />
      {[
        ['privatepolicy', '隐私协议'],
        ['userpolicy', '用户协议'],
        ['privatepolicy_en', '隐私协议（英文）'],
        ['userpolicy_en', '用户协议（英文）'],
        ['privatepolicy_jp', '隐私协议（日文）'],
        ['userpolicy_jp', '用户协议（日文）'],
        ['privatepolicy_kr', '隐私协议（韩文）'],
        ['userpolicy_kr', '用户协议（韩文）'],
      ].map(([name, label]) => (
        <ProFormTextArea
          key={name}
          name={name}
          label={label}
          rules={[{ required: true, message: '请输入' }]}
          fieldProps={{ autoSize: { minRows: 4 } }}
        />
      ))}
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteProtocolV2(uuid)
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
      <ProTable<GetProtocolV2Res>
        actionRef={actionRef}
        rowKey="uuid"
        search={false}
        pagination={false}
        toolBarRender={() => [
          <EditProtocol key="add" reload={() => actionRef.current?.reload()} />,
        ]}
        request={() => getProtocolV2All().then(listToTable)}
        scroll={{ x: 'max-content' }}
        columns={[
          { align: 'center', title: '序号', key: 'index', width: 80, render: renderIndex },
          { align: 'center', title: '版本', dataIndex: 'version' },
          {
            align: 'left',
            title: '隐私协议',
            dataIndex: 'privatepolicy',
            ellipsis: true,
            render: (_, record) => {
              const link = completeImgUrl(record.privatepolicy as string);
              return record.privatepolicy ? (
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              ) : (
                '--'
              );
            },
          },
          {
            align: 'left',
            title: '用户协议',
            dataIndex: 'userpolicy',
            ellipsis: true,
            render: (_, record) => {
              const link = completeImgUrl(record.userpolicy as string);
              return record.userpolicy ? (
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              ) : (
                '--'
              );
            },
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 150,
            render: (_, record) => (
              <Space>
                <EditProtocol data={record} reload={() => actionRef.current?.reload()} />
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
