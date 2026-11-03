import UuidCell from '@/components/UuidCell';
import { getAppResourceAllRoot } from '@/services/modules/app-resource';
import type { GetProductListReq, GetProductListRes } from '@/services/modules/product';
import { deleteProduct, getProductAll, getProductPage } from '@/services/modules/product';
import {
  getProductOtaRelationUuids,
  getProductRelations,
  patchProductOtaRelations,
  patchProductRelations,
} from '@/services/modules/product-relation';
import { getProductSyncStatus } from '@/services/modules/product-sync';
import { deviceType } from '@/utils/data';
import { renderIndex, tablePagination } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
import {
  CloseOutlined,
  FilePdfOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { DrawerForm, PageContainer, ProFormSelect, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import type { ReactElement } from 'react';
import { useMemo, useRef, useState } from 'react';
import Add from './component/Add';
import Sync from './component/Sync';

const Relation = ({
  data,
  type,
  reload,
  trigger,
}: {
  data: GetProductListRes;
  type: 'product' | 'ota';
  reload?: () => void;
  trigger?: ReactElement;
}) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<{ relatedUuids: string[] }>();
  const { data: productAll, run: loadOptions } = useRequest(getProductAll, {
    manual: true,
  });
  const options = useMemo(
    () =>
      productAll
        ?.filter((item) => item.uuid !== data.uuid)
        .map((item) => ({
          label: `${item.model}${item.name ? `（${item.name}）` : ''}`,
          value: item.uuid,
        })),
    [productAll, data.uuid],
  );
  const { run: loadProductRelations } = useRequest(() => getProductRelations(data.uuid), {
    manual: true,
    onSuccess: (res) => {
      form.setFieldsValue({ relatedUuids: res.map((item) => item.uuid) });
    },
  });
  const { run: loadOtaRelations } = useRequest(() => getProductOtaRelationUuids(data.uuid), {
    manual: true,
    onSuccess: (res) => {
      form.setFieldsValue({ relatedUuids: res.relatedUuids });
    },
  });
  const { runAsync: saveProductRelations } = useRequest(
    (relatedUuids: string[]) => patchProductRelations(data.uuid, { relatedUuids }),
    {
      manual: true,
      onSuccess: () => {
        message.success('保存成功');
        reload?.();
      },
    },
  );
  const { runAsync: saveOtaRelations } = useRequest(
    (relatedUuids: string[]) => patchProductOtaRelations(data.uuid, { relatedUuids }),
    {
      manual: true,
      onSuccess: () => {
        message.success('保存成功');
        reload?.();
      },
    },
  );

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={`${type === 'product' ? '产品关联' : 'OTA关联'}：${data.model}`}
      trigger={trigger ?? <Button>{type === 'product' ? '产品关联' : 'OTA关联'}</Button>}
      drawerProps={{
        width: md ? 460 : '100%',
        maskClosable: false,
        getContainer: undefined,
        // 预渲染抽屉内容，避免 useForm 实例未连接 Form 的控制台警告
        forceRender: true,
      }}
      onVisibleChange={(visible) => {
        if (visible) {
          loadOptions({});
          if (type === 'product') {
            loadProductRelations();
          } else {
            loadOtaRelations();
          }
        } else {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const relatedUuids = values.relatedUuids ?? [];
        const request =
          type === 'product' ? saveProductRelations(relatedUuids) : saveOtaRelations(relatedUuids);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormSelect
        name="relatedUuids"
        label="关联产品"
        fieldProps={{ mode: 'multiple' }}
        options={options}
      />
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  // 推送模式：点击工具栏推送图标后表格出现多选框，选中后在顶部操作条里推送
  const [syncMode, setSyncMode] = useState(false);
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [syncUuids, setSyncUuids] = useState<string[]>();

  // 推送能力状态：开启才显示推送入口；name 用于文案
  const { data: syncStatus } = useRequest(getProductSyncStatus);
  const syncEnabled = Boolean(syncStatus?.enabled);

  const { data: appResourceRoots } = useRequest(getAppResourceAllRoot);
  const chipOptions = useMemo(
    () => appResourceRoots?.map((item) => ({ label: item.name, value: item.uuid })),
    [appResourceRoots],
  );

  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const { runAsync: deleteProductAsync } = useRequest(deleteProduct, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });
  const deleteBrandRun = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    return deleteProductAsync(uuid)
      .catch(() => undefined)
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  // const { run: migrateSkuRun, loading: migrateSkuLoading } = useRequest(migrateProductSku, {
  //   manual: true,
  //   onSuccess: (res) => {
  //     message.success(
  //       `迁移完成：共 ${res.total} 个产品，本次迁移 ${res.migrated} 个，已存在跳过 ${res.skipped} 个`,
  //     );
  //     actionRef.current?.reload();
  //   },
  // });

  return (
    <PageContainer>
      <ProTable<GetProductListRes, GetProductListReq>
        actionRef={actionRef}
        rowKey="uuid"
        bordered={true}
        rowSelection={
          syncMode
            ? {
                // 推送一次只能选 1 条：勾选第二条时提示并保持原选择
                type: 'checkbox',
                selectedRowKeys: selectedUuids,
                onChange: (keys) => {
                  if (keys.length > 1) {
                    message.warning('一次只能推送 1 个产品');
                    return;
                  }
                  setSelectedUuids(keys as string[]);
                },
              }
            : undefined
        }
        tableAlertOptionRender={({ selectedRows }) => (
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => setSyncUuids(selectedRows.map((row) => row.uuid))}
            >
              推送到{syncStatus?.name || '对端'}（{selectedRows.length}）
            </Button>
            <Button size="small" onClick={() => setSelectedUuids([])}>
              取消选择
            </Button>
          </Space>
        )}
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
          <Add
            key="add"
            reload={actionRef.current?.reload}
            trigger={
              <Button type="primary" icon={<PlusOutlined />}>
                新建
              </Button>
            }
          />,
          syncEnabled && (
            <Tooltip
              key="sync"
              title={syncMode ? '退出推送' : `推送到${syncStatus?.name || '对端'}`}
            >
              <Button
                type="text"
                icon={syncMode ? <CloseOutlined /> : <SendOutlined />}
                style={syncMode ? { color: '#fff', background: '#1890ff' } : undefined}
                onClick={() => {
                  setSyncMode(!syncMode);
                  setSelectedUuids([]);
                  setSyncUuids(undefined);
                }}
              />
            </Tooltip>
          ),
        ]}
        request={(param) => {
          const { current, pageSize, uuid, model, type, appResourceRootUuid } = param;
          return getProductPage({
            uuid,
            model,
            type,
            appResourceRootUuid,
            pageIndex: current,
            pageSize,
          }).then((res) => ({
            success: true,
            data: res.list,
            total: res.total,
          }));
        }}
        pagination={{
          ...tablePagination,
        }}
        scroll={{ x: 'max-content' }}
        columnsState={{
          defaultValue: {
            createTime: { show: false },
            updateTime: { show: false },
          },
        }}
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
            dataIndex: 'uuid',
            // width: 220,
            search: false,
            render: (_, record) => <UuidCell uuid={record.uuid} />,
          },
          {
            align: 'center',
            title: '创建时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            width: 165,
            search: false,
          },
          {
            align: 'center',
            title: '编辑时间',
            dataIndex: 'updateTime',
            valueType: 'dateTime',
            width: 165,
            search: false,
          },
          {
            align: 'center',
            title: '型号',
            dataIndex: 'model',
          },
          {
            align: 'center',
            title: '名称',
            search: false,
            dataIndex: 'name',
          },
          {
            title: '类型',
            dataIndex: 'type',
            valueType: 'select',
            fieldProps: {
              options: deviceType.$list().map(({ key: value, value: label }) => ({ value, label })),
              allowClear: true,
              placeholder: '请选择类型',
            },
          },
          {
            title: 'UUID',
            dataIndex: 'uuid',
            hideInTable: true,
            fieldProps: {
              placeholder: '精确匹配',
              allowClear: true,
            },
          },
          {
            align: 'left',
            title: '属性',
            search: false,
            key: 'tags',
            width: 200,
            render: (_, record) => {
              const tagColorMap: Record<string, string> = {
                OTA配置: 'blue',
                TWS: 'geekblue',
                音箱: 'processing',
                游戏耳机: 'success',
                解码耳放: 'warning',
                Dongle升级: 'cyan',
                总增益: 'purple',
                前级增益: 'magenta',
              };
              const items: string[] = [];
              if (record.hasotaconfig) items.push('OTA配置');
              if (record.istws) items.push('TWS');
              if (record.isSpeaker) items.push('音箱');
              if (record.isGamingHeadphone) items.push('游戏耳机');
              if (record.isDacAmp) items.push('解码耳放');
              if (record.isDongleUpgradable) items.push('Dongle升级');
              if (record.isTotalGainSupported) items.push('总增益');
              if (record.isPreGainSupported) items.push('前级增益');
              if (items.length === 0) return '-';
              return (
                <Space size={4} wrap>
                  {items.map((text) => (
                    <Tag key={text} color={tagColorMap[text] ?? 'default'} style={{ margin: 0 }}>
                      {text}
                    </Tag>
                  ))}
                </Space>
              );
            },
          },
          {
            align: 'center',
            title: '芯片',
            dataIndex: 'appResourceRootUuid',
            hideInTable: true,
            valueType: 'select',
            fieldProps: {
              options: chipOptions,
              showSearch: true,
              optionFilterProp: 'label',
              allowClear: true,
              placeholder: '请选择芯片',
            },
          },
          {
            align: 'center',
            title: '芯片',
            search: false,
            dataIndex: ['appResourceRoot', 'name'],
          },
          {
            align: 'center',
            title: '说明书',
            search: false,
            dataIndex: 'manual',
            // width: 90,
            render: (_, record) => {
              if (!record.manual) return '--';
              const link = completeImgUrl(record.manual as string);
              return (
                <Tooltip title="查看说明书">
                  <a href={link} target="_blank" rel="noreferrer">
                    <FilePdfOutlined style={{ fontSize: 18 }} />
                  </a>
                </Tooltip>
              );
            },
          },
          {
            align: 'center',
            title: '详情页',
            search: false,
            dataIndex: 'sellpic',
            // width: 90,
            render: (_, record) => {
              if (!record.sellpic) return '--';
              const link = completeImgUrl(record.sellpic as string);
              return (
                <Tooltip title="查看详情页">
                  <a href={link} target="_blank" rel="noreferrer">
                    <LinkOutlined style={{ fontSize: 18 }} />
                  </a>
                </Tooltip>
              );
            },
          },
          {
            align: 'center',
            title: '操作',
            key: 'option',
            valueType: 'option',
            // width: 180,
            render: (_, record) => {
              return (
                <Space size={4} direction="horizontal">
                  <Add
                    reload={actionRef.current?.reload}
                    data={{ ...record }}
                    trigger={<Button type="primary">编辑</Button>}
                  />
                  <Relation
                    data={record}
                    type="product"
                    reload={actionRef.current?.reload}
                    trigger={<Button>产品关联</Button>}
                  />
                  <Relation
                    data={record}
                    type="ota"
                    reload={actionRef.current?.reload}
                    trigger={<Button>OTA关联</Button>}
                  />
                  <Popconfirm
                    title="确定删除该产品吗？"
                    okButtonProps={{
                      loading: deleteLoading[record.uuid],
                    }}
                    overlayStyle={{ width: 200 }}
                    onConfirm={() => {
                      deleteBrandRun(record.uuid);
                    }}
                  >
                    <Button type="primary" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />
      <Sync
        uuids={syncUuids}
        onClose={(needReload) => {
          setSyncUuids(undefined);
          setSelectedUuids([]);
          if (needReload) actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};
