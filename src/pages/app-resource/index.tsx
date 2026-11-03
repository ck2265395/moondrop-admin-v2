import {
  getAppResourceAll,
  getAppResourceAllList,
  getAppResourceAllRoot,
  getAppResourceOtaConfigs,
  getAppResourceProducts,
  patchAppResource,
  postAppResource,
  type GetAppResourceOtaConfigsRes,
  type GetAppResourceProductUsageRes,
  type GetAppResourceRes,
} from '@/services/modules/app-resource';
import {
  deleteAppResourceDict,
  getAppResourceDictAdminPage,
  patchAppResourceDict,
  postAppResourceDict,
  type AppResourceDictItem,
  type GetAppResourceDictAdminPageReq,
  type PatchAppResourceDictReq,
  type PostAppResourceDictReq,
} from '@/services/modules/app-resource-dict';
import { deviceType, NULL_UUID, type DeviceType } from '@/utils/data';
import { flat2Tree, getProductModelName, sortTreeChildrenByName } from '@/utils/utils';
import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FormOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { DrawerForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Form,
  Grid,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ResourceRow extends GetAppResourceRes {
  children?: ResourceRow[];
}

interface TreeNode {
  title: string;
  value: string;
  children?: TreeNode[];
}

interface UsageModalProps {
  record: ResourceRow;
  visible: boolean;
  onClose: () => void;
}

/**
 * 使用情况弹窗：
 * 平台行展示挂载在该平台下的产品（型号、类型）；功能行展示引用该资源的OTA配置及功能配置
 */
const UsageModal = ({ record, visible, onClose }: UsageModalProps) => {
  const { md } = Grid.useBreakpoint();
  const isPlatform = record.parentUuid === NULL_UUID;
  const {
    data: productList = [],
    loading: productLoading,
    run: runProducts,
  } = useRequest(getAppResourceProducts, { manual: true });
  const {
    data: otaConfigList = [],
    loading: otaConfigLoading,
    run: runOtaConfigs,
  } = useRequest(getAppResourceOtaConfigs, { manual: true });

  useEffect(() => {
    if (!visible) return;
    if (isPlatform) {
      runProducts(record.uuid);
    } else {
      runOtaConfigs(record.uuid);
    }
  }, [visible, isPlatform, record.uuid, runProducts, runOtaConfigs]);

  return (
    <Modal
      title={`使用情况 - ${record.name}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={md ? 900 : '100%'}
      destroyOnHidden
    >
      {isPlatform ? (
        <ProTable<GetAppResourceProductUsageRes>
          rowKey="uuid"
          dataSource={productList}
          loading={productLoading}
          search={false}
          options={false}
          toolBarRender={false}
          pagination={{ defaultPageSize: 10, showSizeChanger: false }}
          columns={[
            { title: '产品型号', dataIndex: 'model' },
            {
              title: '类型',
              dataIndex: 'type',
              width: 120,
              render: (_, item) => deviceType[item.type as DeviceType],
            },
          ]}
        />
      ) : (
        <ProTable<GetAppResourceOtaConfigsRes>
          rowKey="uuid"
          dataSource={otaConfigList}
          loading={otaConfigLoading}
          search={false}
          options={false}
          toolBarRender={false}
          pagination={{ defaultPageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: '所属产品',
              dataIndex: 'productModel',
              width: 160,
              render: (_, item) => getProductModelName(item.productModel ?? '', item.productName),
            },
            { title: '名称', dataIndex: 'name', width: 220 },
            { title: '版本', dataIndex: 'version', width: 100 },
            {
              title: '功能配置',
              dataIndex: 'appResourceNames',
              render: (_, item) => (
                <span
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    columnGap: 8,
                    rowGap: 2,
                  }}
                >
                  {[...item.appResourceNames]
                    .sort((a, b) => a.localeCompare(b))
                    .map((name) => (
                      <span
                        key={name}
                        style={{
                          whiteSpace: 'nowrap',
                          ...(name === record.name
                            ? {
                                color: '#1677ff',
                                fontWeight: 500,
                              }
                            : {}),
                        }}
                      >
                        {name}
                      </span>
                    ))}
                </span>
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
};

/** 使用情况单元格：平台行统计挂载产品数，功能行统计引用次数；0 置灰不可点击（平台无产品时留空） */
const UsageCell = ({ record }: { record: ResourceRow }) => {
  const [visible, setVisible] = useState(false);
  const isPlatform = record.parentUuid === NULL_UUID;
  const count = record.usageCount ?? 0;
  if (!count) {
    return isPlatform ? null : <span style={{ color: '#bfbfbf' }}>0</span>;
  }
  return (
    <>
      <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setVisible(true)}>
        {count}
      </Button>
      <UsageModal record={record} visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};

interface AddResourceProps {
  parentUuid: string;
  parentName?: string;
  parentUri?: string;
  readonlyParent?: boolean;
  treeData: TreeNode[];
  reload?: () => void;
  trigger: React.ReactElement;
}

const AddResource = ({
  parentUuid,
  parentName,
  parentUri,
  readonlyParent,
  treeData,
  reload,
  trigger,
}: AddResourceProps) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const { runAsync: run, loading } = useRequest(postAppResource, {
    manual: true,
    onSuccess: () => {
      message.success('新增成功');
      reload?.();
    },
  });

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title="新增资源"
      trigger={trigger}
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible) {
          form.setFieldsValue({
            parentUuid,
            uri: parentUri ? `${parentUri}/` : undefined,
          });
        } else {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        return run({
          name: values.name,
          parentUuid: readonlyParent ? parentUuid : values.parentUuid,
          uri: values.uri,
        })
          .then(() => true)
          .catch(() => false);
      }}
      submitter={{ submitButtonProps: { loading } }}
    >
      {readonlyParent ? (
        <Form.Item label="父节点">
          <Input value={parentName || '无'} disabled />
        </Form.Item>
      ) : (
        <Form.Item
          name="parentUuid"
          label="父节点"
          rules={[{ required: true, message: '请选择父节点' }]}
        >
          <TreeSelect
            treeData={treeData}
            treeDefaultExpandAll
            showSearch
            treeNodeFilterProp="title"
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            placeholder="请选择父节点"
          />
        </Form.Item>
      )}
      <ProFormText
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
        extra="同级下名称不可重复"
      />
      <ProFormText
        name="uri"
        label="资源路径（URI）"
        rules={[{ required: true, message: '请输入资源路径' }]}
        extra="如 /JieliUSB/EQ"
      />
    </DrawerForm>
  );
};

interface EditResourceProps {
  record: ResourceRow;
  reload?: () => void;
  trigger: React.ReactElement;
}

const EditResource = ({ record, reload, trigger }: EditResourceProps) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const { runAsync: run, loading } = useRequest(
    (params: { name: string; uri: string }) => patchAppResource(record.uuid, params),
    {
      manual: true,
      onSuccess: () => {
        message.success('修改成功');
        reload?.();
      },
    },
  );

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title="修改资源"
      trigger={trigger}
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible) {
          form.setFieldsValue({ name: record.name, uri: record.uri });
        } else {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        return run({ name: values.name, uri: values.uri })
          .then(() => true)
          .catch(() => false);
      }}
      submitter={{ submitButtonProps: { loading } }}
    >
      <ProFormText
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
        extra="同级下名称不可重复"
      />
      <ProFormText
        name="uri"
        label="资源路径（URI）"
        rules={[{ required: true, message: '请输入资源路径' }]}
        extra="不能与父节点路径相同，如 /JieliUSB/EQ"
      />
    </DrawerForm>
  );
};

const ResourceTreeTab = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);

  const { data: rootList = [] } = useRequest(getAppResourceAllRoot);

  const { data: nodeList = [], run: runNodeList } = useRequest(getAppResourceAllList, {
    manual: true,
  });

  const treeData = useMemo<TreeNode[]>(() => {
    const rootNodes: TreeNode[] = rootList.map((item) => ({
      title: item.name,
      value: item.uuid,
      children: [],
    }));
    if (!nodeList.length) return rootNodes;
    const childTree = flat2Tree(nodeList, { parent: 'parentUuid', current: 'uuid' });
    const build = (nodes: ResourceRow[]): TreeNode[] =>
      nodes.map((node) => ({
        title: node.name,
        value: node.uuid,
        children: node.children ? build(node.children) : undefined,
      }));
    const childTreeNodes = sortTreeChildrenByName(build(childTree), (n) => n.title);
    const childRootUuids = new Set(childTreeNodes.map((n) => n.value));
    return [...childTreeNodes, ...rootNodes.filter((r) => !childRootUuids.has(r.value))];
  }, [nodeList, rootList]);

  return (
    <>
      <style>{`
        .app-resource-action-icon {
          cursor: pointer;
          color: rgba(0, 0, 0, 0.45);
          font-size: 16px;
          transition: color 0.2s;
        }
        .app-resource-action-icon:hover {
          color: #1677ff;
        }
      `}</style>
      <ProTable<ResourceRow, { rootUuid?: string }>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={false}
        indentSize={40}
        toolBarRender={() => [
          <AddResource
            key="add"
            parentUuid={NULL_UUID}
            readonlyParent
            treeData={treeData}
            reload={() => actionRef.current?.reload()}
            trigger={
              <Button type="primary" icon={<PlusOutlined />}>
                新建平台
              </Button>
            }
          />,
        ]}
        request={(params) => {
          const req = params.rootUuid
            ? getAppResourceAll({ rootUuid: params.rootUuid })
            : getAppResourceAllList();
          return req.then((res) => {
            runNodeList();
            return {
              success: true,
              data: sortTreeChildrenByName(
                flat2Tree(res, { parent: 'parentUuid', current: 'uuid' }) as ResourceRow[],
                (n) => n.name,
              ),
            };
          });
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '根资源',
            dataIndex: 'rootUuid',
            hideInTable: true,
            valueType: 'select',
            request: () =>
              getAppResourceAllRoot().then((res) =>
                res.map((item) => ({ label: item.name, value: item.uuid })),
              ),
          },
          {
            title: '名称',
            dataIndex: 'name',
            search: false,
            width: 300,
            render: (_, record) => (
              <Space size={6}>
                {record.parentUuid === NULL_UUID && (
                  <Tag color="#1f1f1f" style={{ margin: 0, color: '#fff' }}>
                    平台
                  </Tag>
                )}
                <span>{record.name}</span>
                {record.parentUuid === NULL_UUID && (
                  <AddResource
                    parentUuid={record.uuid}
                    parentName={record.name}
                    parentUri={record.uri}
                    readonlyParent
                    treeData={treeData}
                    reload={() => actionRef.current?.reload()}
                    trigger={
                      <Tooltip title="添加">
                        <span className="app-resource-action-icon">
                          <FileAddOutlined />
                        </span>
                      </Tooltip>
                    }
                  />
                )}
                <EditResource
                  record={record}
                  reload={() => actionRef.current?.reload()}
                  trigger={
                    <Tooltip title="编辑">
                      <span className="app-resource-action-icon">
                        <FormOutlined />
                      </span>
                    </Tooltip>
                  }
                />
              </Space>
            ),
          },
          {
            title: '功能配置描述',
            dataIndex: 'dictDesc',
            search: false,
            width: 240,
            ellipsis: true,
          },
          {
            align: 'center',
            title: '使用情况',
            dataIndex: 'usageCount',
            search: false,
            width: 100,
            render: (_, record) => <UsageCell record={record} />,
          },
          {
            title: 'UUID',
            dataIndex: 'uuid',
            search: false,
            render: (_, record) => (
              <Typography.Text
                copyable={{ text: record.uuid }}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                {record.uuid}
              </Typography.Text>
            ),
          },
          {
            align: 'center',
            title: '子节点数',
            dataIndex: 'children',
            search: false,
            width: 100,
            render: (_, record) =>
              record.children?.length ? <Tag color="green">{record.children.length}</Tag> : '-',
          },
          {
            title: '路径',
            dataIndex: 'uri',
            search: false,
            ellipsis: true,
            render: (_, record) => (
              <span style={{ color: '#888', fontFamily: 'monospace', fontSize: 12 }}>
                {record.uri}
              </span>
            ),
          },
        ]}
      />
    </>
  );
};

interface EditDictProps {
  data?: AppResourceDictItem;
  reload?: () => void;
}

const DictForm = ({ data, reload }: EditDictProps) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<PostAppResourceDictReq>();
  const { runAsync: postRun } = useRequest(postAppResourceDict, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchAppResourceDict, {
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
      title={data ? '编辑功能配置字典' : '新建功能配置字典'}
      trigger={
        <Button type="primary" icon={data ? <EditOutlined /> : <PlusOutlined />}>
          {data ? '编辑' : '新建'}
        </Button>
      }
      drawerProps={{ width: md ? 480 : '100%', maskClosable: false, getContainer: undefined }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({ name: data.name, desc: data.desc });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values: PatchAppResourceDictReq) => {
        const request = data
          ? patchRun(values, data.uuid)
          : postRun(values as PostAppResourceDictReq);
        return request.then(() => true).catch(() => false);
      }}
      initialValues={data ? { name: data.name, desc: data.desc } : {}}
    >
      <ProFormText
        name="name"
        label="资源名"
        rules={[{ required: true, message: '请输入资源名' }]}
        extra="唯一，如 LIVEANC、SettingV2"
      />
      <ProFormText
        name="desc"
        label="功能配置描述"
        rules={[{ required: true, message: '请输入功能配置描述' }]}
        extra="如 Live ANC模式、带增益的Setting"
      />
    </DrawerForm>
  );
};

const DictTab = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const { runAsync: deleteRunAsync } = useRequest(deleteAppResourceDict, {
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
    <ProTable<AppResourceDictItem, GetAppResourceDictAdminPageReq>
      actionRef={actionRef}
      rowKey="uuid"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
      }}
      toolBarRender={() => [<DictForm key="add" reload={() => actionRef.current?.reload()} />]}
      request={(params) =>
        getAppResourceDictAdminPage({
          name: params.name,
          desc: params.desc,
          pageIndex: params.current,
          pageSize: params.pageSize,
        }).then((res) => ({
          success: true,
          data: res.list,
          total: res.total,
        }))
      }
      columns={[
        {
          align: 'center',
          title: '序号',
          key: 'index',
          width: 80,
          fixed: 'left',
          search: false,
          render: (_, __, idx) => idx + 1,
        },
        {
          title: '资源名',
          dataIndex: 'name',
          width: 200,
        },
        {
          title: '功能配置描述',
          dataIndex: 'desc',
          search: false,
        },
        {
          align: 'center',
          title: '创建时间',
          dataIndex: 'createTime',
          width: 160,
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
              <DictForm data={record} reload={() => actionRef.current?.reload()} />
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
  );
};

export default () => {
  return (
    <PageContainer>
      <style>{`
        .app-resource-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #d3d0d0ff !important;
        }
      `}</style>
      <Tabs
        className="app-resource-tabs"
        defaultActiveKey="resource"
        items={[
          { key: 'resource', label: 'APP资源', children: <ResourceTreeTab /> },
          { key: 'dict', label: '功能配置字典', children: <DictTab /> },
        ]}
      />
    </PageContainer>
  );
};
