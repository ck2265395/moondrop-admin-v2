import FileUpload from '@/components/FileUpload';
import type {
  GetPeqConfigTagAdminAllReq,
  GetPeqConfigTagAdminAllRes,
  GetPeqConfigTagAdminListRes,
  PostPeqConfigTagAdminReq,
} from '@/services/modules/peq-config-tag-admin';
import {
  deletePeqConfigTagAdmin,
  getPeqConfigTagAdminAll,
  getPeqConfigTagAdminList,
  getPeqConfigTagAdminTypeList,
  patchPeqConfigTagAdmin,
  postPeqConfigTagAdmin,
  TagType,
  TagTypeLabel,
} from '@/services/modules/peq-config-tag-admin';
import { listToTable, renderFileLink, renderIndex } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DrawerForm, PageContainer, ProFormDigit, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Divider,
  Drawer,
  Form,
  Grid,
  Image,
  message,
  Popconfirm,
  Space,
  Switch,
} from 'antd';
import { useMemo, useRef, useState } from 'react';

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

interface TagFormData extends Omit<PostPeqConfigTagAdminReq, 'icon'> {
  icon: string[];
}

const EditTag = ({
  data,
  reload,
  typeOptions,
}: {
  data?: GetPeqConfigTagAdminAllRes;
  reload?: () => void;
  typeOptions: { label: string; value: string }[];
}) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<TagFormData>();
  const { runAsync: postRun } = useRequest(postPeqConfigTagAdmin, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchPeqConfigTagAdmin, {
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
      title={data ? '编辑配置标签' : '新建配置标签'}
      trigger={
        <Button type="primary" size="middle" icon={data ? <EditOutlined /> : <PlusOutlined />}>
          {data ? '编辑' : '新建'}
        </Button>
      }
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
      initialValues={{
        type: TagType.GAME,
        status: 1,
        sortOrder: 1,
      }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({
            ...data,
            type: data.type as TagType,
            icon: data.icon ? [data.icon] : [],
          });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload: PostPeqConfigTagAdminReq = {
          title: values.title,
          title_enUS: values.title_enUS,
          title_jaJP: values.title_jaJP,
          title_koKR: values.title_koKR,
          type: values.type,
          status: values.status,
          icon: values.icon?.[0],
          sortOrder: values.sortOrder,
        };
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText
        name="title"
        label="标题（中）"
        rules={[{ required: true, message: '请输入中文标题' }]}
      />
      <ProFormText
        name="title_enUS"
        label="标题（英）"
        rules={[{ required: true, message: '请输入英文标题' }]}
      />
      <ProFormText
        name="title_jaJP"
        label="标题（日）"
        rules={[{ required: true, message: '请输入日文标题' }]}
      />
      <ProFormText
        name="title_koKR"
        label="标题（韩）"
        rules={[{ required: true, message: '请输入韩文标题' }]}
      />
      <ProFormSelect
        name="type"
        label="类型"
        options={typeOptions}
        rules={[{ required: true, message: '请选择类型' }]}
      />

      <ProFormSelect name="status" label="状态" options={statusOptions} />
      <ProFormDigit
        name="sortOrder"
        label="排序"
        min={1}
        max={256}
        fieldProps={{ precision: 0 }}
        extra="1-256，值越小越靠前"
      />
      <Form.Item
        name="icon"
        label="图标"
        rules={[{ required: true, type: 'array', message: '请上传图标' }]}
      >
        <FileUpload fileGroup="peq-config-file" ext={['.png', '.svg']} max={1} />
      </Form.Item>
    </DrawerForm>
  );
};

export default () => {
  const { md } = Grid.useBreakpoint();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const { data: typeList = [] } = useRequest(getPeqConfigTagAdminTypeList);
  const typeOptions = typeList.map((item) => ({
    label: item.value,
    value: item.key,
  }));
  const typeEnum = Object.fromEntries(typeOptions.map((item) => [item.value, item.label]));
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const handlePatch = (status: 0 | 1, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchPeqConfigTagAdmin({ status }, uuid)
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
    deletePeqConfigTagAdmin(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const {
    data: previewList,
    run: runPreview,
    loading: previewLoading,
  } = useRequest(getPeqConfigTagAdminList, { manual: true });

  // 按 type 分组
  const groupedPreview = useMemo(() => {
    const map: Record<string, GetPeqConfigTagAdminListRes[]> = {};
    (previewList || []).forEach((item) => {
      if (!map[item.type]) map[item.type] = [];
      map[item.type].push(item);
    });
    return map;
  }, [previewList]);

  const openPreview = () => {
    runPreview();
    setPreviewOpen(true);
  };

  return (
    <PageContainer>
      <Drawer
        title="前端展示预览"
        width={md ? 480 : '100%'}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : !previewList?.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无启用的标签</div>
        ) : (
          Object.entries(groupedPreview).map(([type, items]) => (
            <div key={type} style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff' }}>
                {TagTypeLabel[type] || type}
                <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                  （{items.length}个）
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {items.map((item) => (
                  <div
                    key={item.uuid}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 72,
                    }}
                  >
                    <Image
                      src={completeImgUrl(item.icon)}
                      width={40}
                      height={40}
                      style={{ objectFit: 'contain', borderRadius: 6 }}
                      preview={false}
                    />
                    <div
                      style={{
                        fontSize: 12,
                        color: '#666',
                        marginTop: 4,
                        maxWidth: 72,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb' }}>#{item.sortOrder}</div>
                  </div>
                ))}
              </div>
              <Divider style={{ margin: '20px 0 0' }} />
            </div>
          ))
        )}
      </Drawer>

      <ProTable<GetPeqConfigTagAdminAllRes, GetPeqConfigTagAdminAllReq>
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
        toolBarRender={() => [
          <EditTag
            key="add"
            reload={() => actionRef.current?.reload()}
            typeOptions={typeOptions}
          />,
          <Button key="preview" icon={<EyeOutlined />} onClick={openPreview}>
            预览
          </Button>,
        ]}
        request={(params) =>
          getPeqConfigTagAdminAll({
            title: params.title,
            type: params.type,
            status: params.status,
          }).then(listToTable)
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
            title: '标题（中）',
            dataIndex: 'title',
          },
          {
            align: 'center',
            title: '标题（英）',
            dataIndex: 'title_enUS',
            search: false,
          },
          {
            align: 'center',
            title: '标题（日）',
            dataIndex: 'title_jaJP',
            search: false,
          },
          {
            align: 'center',
            title: '标题（韩）',
            dataIndex: 'title_koKR',
            search: false,
          },
          {
            align: 'center',
            title: '类型',
            dataIndex: 'type',
            fieldProps: { options: typeOptions },
            valueType: 'select',
            render: (_, record) => typeEnum[record.type] || record.type,
          },
          {
            align: 'center',
            title: '排序',
            dataIndex: 'sortOrder',
            search: false,
            width: 80,
          },
          {
            align: 'center',
            title: '预览',
            dataIndex: 'icon',
            search: false,
            render: (val) => (
              <Image
                src={completeImgUrl(val as string)}
                width={48}
                height={48}
                style={{ objectFit: 'contain' }}
              />
            ),
          },
          {
            align: 'center',
            title: '文件',
            dataIndex: 'icon',
            search: false,
            render: (val) => renderFileLink(val as string),
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            valueEnum: { 1: '启用', 0: '禁用' },
            render: (_, record) => (
              <Switch
                checked={record.status === 1}
                loading={patchLoading[record.uuid]}
                onChange={() => handlePatch(record.status === 1 ? 0 : 1, record.uuid)}
              />
            ),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 120,
            render: (_, record) => (
              <Space size={4}>
                <EditTag
                  data={record}
                  reload={() => actionRef.current?.reload()}
                  typeOptions={typeOptions}
                />
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
