import type {
  GetQaCategoryReq,
  GetQaCategoryRes,
  PostQaCategoryReq,
  QaItem,
} from '@/services/modules/qa-category';
import {
  deleteQaCategory,
  getQaCategoryAll,
  getQaCategoryConfig,
  patchQaCategory,
  postQaCategory,
  postQaCategoryConfig,
} from '@/services/modules/qa-category';
import { pageToTable, renderIndex, tablePagination } from '@/utils/table';
import { DrawerForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, Input, message, Popconfirm, Space } from 'antd';
import { useRef, useState } from 'react';
import './index.less';

const langFields = [
  ['title', '标题'],
  ['titleEn', '标题（英文）'],
  ['titleJp', '标题（日文）'],
  ['titleKr', '标题（韩文）'],
  ['titleTw', '标题（繁中）'],
];

const qaFields = [
  ['question', '问题'],
  ['answer', '答案'],
  ['questionEn', '问题（英文）'],
  ['answerEn', '答案（英文）'],
  ['questionJp', '问题（日文）'],
  ['answerJp', '答案（日文）'],
  ['questionKr', '问题（韩文）'],
  ['answerKr', '答案（韩文）'],
  ['questionTw', '问题（繁中）'],
  ['answerTw', '答案（繁中）'],
];

const EditCategory = ({ data, reload }: { data?: GetQaCategoryRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<PostQaCategoryReq>();
  const { runAsync: postRun } = useRequest(postQaCategory, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchQaCategory, {
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
      title={data ? '编辑 QA 分类' : '新建 QA 分类'}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
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
          ? patchRun(values as PostQaCategoryReq, data.uuid)
          : postRun(values as PostQaCategoryReq);
        return request.then(() => true).catch(() => false);
      }}
    >
      {langFields.map(([name, label], index) => (
        <ProFormText
          key={name}
          name={name}
          label={label}
          rules={index === 0 ? [{ required: true, message: '请输入' }] : undefined}
        />
      ))}
    </DrawerForm>
  );
};

const EditQaConfig = ({ record }: { record: GetQaCategoryRes }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<{ qaItems: QaItem[] }>();
  const { run: loadConfig } = useRequest(() => getQaCategoryConfig(record.uuid), {
    manual: true,
    onSuccess: (res) => {
      form.setFieldsValue({ qaItems: res.qaItems });
    },
  });
  const { runAsync: saveConfig } = useRequest(
    (qaItems: QaItem[]) => postQaCategoryConfig(record.uuid, { qaItems }),
    {
      manual: true,
      onSuccess: () => {
        message.success('保存成功');
      },
    },
  );

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={`QA 配置：${record.title}`}
      trigger={<Button>QA项</Button>}
      drawerProps={{ width: md ? 760 : '100%', maskClosable: false, getContainer: undefined }}
      onOpenChange={(visible) => {
        if (visible) {
          loadConfig();
        } else {
          form.resetFields();
        }
      }}
      onFinish={(values) =>
        saveConfig(values.qaItems ?? [])
          .then(() => true)
          .catch(() => false)
      }
    >
      <Form.List name="qaItems">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => (
              <div key={field.key} className="admin-inline-list">
                <Space align="start">
                  <span className="admin-inline-list__index">{index + 1}</span>
                  <Button danger onClick={() => remove(field.name)}>
                    删除
                  </Button>
                </Space>
                {qaFields.map(([name, label], itemIndex) => (
                  <Form.Item
                    key={name}
                    name={[field.name, name]}
                    label={label}
                    rules={itemIndex < 2 ? [{ required: true, message: '请输入' }] : undefined}
                  >
                    <Input.TextArea autoSize={{ minRows: itemIndex % 2 === 0 ? 1 : 2 }} />
                  </Form.Item>
                ))}
              </div>
            ))}
            <Button type="dashed" block onClick={() => add({})}>
              新增 QA 项
            </Button>
          </>
        )}
      </Form.List>
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteQaCategory(uuid)
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
      <ProTable<GetQaCategoryRes, GetQaCategoryReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [
          <EditCategory key="add" reload={() => actionRef.current?.reload()} />,
        ]}
        request={(params) =>
          getQaCategoryAll({
            pageIndex: params.current,
            pageSize: params.pageSize,
            title: params.title,
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
          { align: 'center', title: '标题', dataIndex: 'title' },
          { align: 'center', title: '英文', dataIndex: 'titleEn', search: false },
          { align: 'center', title: '日文', dataIndex: 'titleJp', search: false },
          { align: 'center', title: '韩文', dataIndex: 'titleKr', search: false },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 210,
            render: (_, record) => (
              <Space>
                <EditQaConfig record={record} />
                <EditCategory data={record} reload={() => actionRef.current?.reload()} />
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
