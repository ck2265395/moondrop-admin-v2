import UuidCell from '@/components/UuidCell';
import type { GetOtaConfigAllReq, GetOtaConfigAllRes, PostOtaConfigReq } from '@/services/modules/ota-config';
import {
  deleteOtaConfig,
  duplicateOtaConfig,
  getOtaConfigPage,
  patchOtaConfig,
} from '@/services/modules/ota-config';
import { getProductAll } from '@/services/modules/product';
import { OtaConfigType } from '@/utils/data';
import { renderFileIcon, renderIndex, tablePagination } from '@/utils/table';
import { completeImgUrl, getProductModelName } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Grid, message, Modal, Popconfirm, Space, Switch, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import Add from './component/Add';
import EQ from './component/EQ';
import Voice from './component/Voice';
import './index.less';

const getEnableValidationError = (record: GetOtaConfigAllRes) => {
  if (!record.name.trim() || !record.version.trim()) {
    return '请先填写名称和版本号';
  }
  if (/_副本\d*$/.test(record.name.trim()) || /_副本\d*$/.test(record.version.trim())) {
    return '请先修改名称和版本号，移除“_副本”后缀';
  }
  return undefined;
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [duplicatingUuid, setDuplicatingUuid] = useState<string>();
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const { md } = Grid.useBreakpoint();

  const handlePatch = (opt: Partial<PostOtaConfigReq>, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchOtaConfig(opt, uuid)
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
    deleteOtaConfig(uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const duplicateSubtree = async (record: GetOtaConfigAllRes) => {
    setDuplicatingUuid(record.uuid);
    try {
      const result = await duplicateOtaConfig(record.uuid);
      message.success(`已复制 ${result.count} 条 OTA 配置及其EQ、提示音配置。`);
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error && error.message ? `副本创建失败：${error.message}` : '副本创建失败',
      );
    } finally {
      setDuplicatingUuid(undefined);
    }
  };

  return (
    <PageContainer>
      <ProTable<GetOtaConfigAllRes, GetOtaConfigAllReq>
        actionRef={actionRef}
        rowKey="uuid"
        columnsState={{
          defaultValue: {
            createTime: { show: false },
            updateTime: { show: false },
          },
        }}
        /* expandedRowKeys={expandedRowKeys}
        onExpandedRowsChange={expandedRows=>{
          setExpandedRowKeys(expandedRows as string[]);
        }} */
        pagination={{
          ...tablePagination,
        }}
        toolBarRender={() => [<Add key="add" reload={actionRef.current?.reload} />]}
        request={(param) => {
          // 搜索列字段名为 key（otaProductUuidSearch），映射回接口参数 productUuid
          const {
            uuid,
            otaProductUuidSearch: productUuid,
            status,
            name,
            current,
            pageSize,
          } = param as typeof param & { otaProductUuidSearch?: string };
          return getOtaConfigPage({
            uuid,
            productUuid,
            status,
            name,
            pageIndex: current,
            pageSize,
          }).then((res) => {
            return {
              success: true,
              data: res.list,
              total: res.total,
            };
          });
        }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            width: 70,
            search: false,
            render: renderIndex,
          },
          {
            align: 'center',
            title: '所属产品',
            // pro-table 按 key||dataIndex 全局缓存搜索列 request 结果，与其他页面区分 key 防止串缓存
            key: 'otaProductUuidSearch',
            dataIndex: 'productUuid',
            hideInTable: true,
            request: async () => {
              // 仅展示已勾选 OTA 配置的产品
              const res = await getProductAll({});
              return res
                .filter((item) => item.hasotaconfig)
                .map((item) => ({
                  label: getProductModelName(item.model, item.name),
                  value: item.uuid,
                }));
            },
            fieldProps: {
              showSearch: true,
              optionFilterProp: 'label',
            },
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            hideInTable: true,
            valueEnum: {
              1: '启用',
              0: '禁用',
            },
          },
          {
            align: 'center',
            title: 'UUID',
            dataIndex: 'uuid',
            width: 210,
            search: false,
            render: (_, record) => <UuidCell uuid={record.uuid} />,
          },
          ...(md
            ? [
                {
                  align: 'left' as const,
                  title: '所属产品',
                  search: false,
                  dataIndex: 'product',
                  width: 240,
                  render: (_: unknown, record: GetOtaConfigAllRes) => {
                    return (
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {getProductModelName(record.product?.model, record.product?.name)}
                      </div>
                    );
                  },
                },
              ]
            : []),
          {
            align: 'left',
            title: '名称',
            dataIndex: 'name',
            width: 180,
            render: (dom) => (
              <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{dom}</div>
            ),
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
            align: 'center',
            title: '版本号',
            dataIndex: 'version',
            search: false,
          },
          {
            align: 'center',
            title: '固件包',
            dataIndex: 'file',
            search: false,
            width: 200,
            render: (_: unknown, record: GetOtaConfigAllRes) => {
              // 分离版本：显示多个固件图标
              if (record.isSeparatedVersion && record.separatedFiles?.length) {
                return (
                  <Space size={6} wrap>
                    {record.separatedFiles.map((f, i) => (
                      <Tooltip key={i} title={f.file}>
                        <a href={completeImgUrl(f.file)} target="_blank" rel="noreferrer">
                          {renderFileIcon(f.file, 24)}
                        </a>
                      </Tooltip>
                    ))}
                  </Space>
                );
              }
              // 普通版本：单个固件图标
              if (record.file) {
                return (
                  <Tooltip title={record.file}>
                    <a href={completeImgUrl(record.file)} target="_blank" rel="noreferrer">
                      {renderFileIcon(record.file, 24)}
                    </a>
                  </Tooltip>
                );
              }
              return '--';
            },
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
            title: '编辑时间',
            dataIndex: 'updateTime',
            width: 160,
            search: false,
            valueType: 'dateTime',
          },
          {
            align: 'center',
            title: '状态',
            key: 'status2',
            search: false,
            render: (_, record) => {
              return (
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  checked={!!record.status}
                  loading={patchLoading[record.uuid]}
                  onChange={() => {
                    if (record.status === 0) {
                      const validationError = getEnableValidationError(record);
                      if (validationError) {
                        message.warning(validationError);
                        return;
                      }
                    }
                    handlePatch(
                      {
                        status: record.status === 0 ? 1 : 0,
                      },
                      record.uuid,
                    );
                  }}
                />
              );
            },
          },
          {
            align: 'center',
            title: '操作',
            key: 'option',
            valueType: 'option',
            width: md ? 420 : 340,
            render: (_, record) => {
              const duplicateConfirm = () => {
                Modal.confirm({
                  title: `创建「${record.name}」的副本？`,
                  // 历史文案（分类树结构时期，含子节点表述），保留备查
                  // content: '将复制当前节点及全部子节点，并复制关联的 EQ 配置、提示音配置和 APP 资源。副本名称会添加“_副本”，配置版本会生成不重复的副本版本；所有副本均禁用并清空固件包及 SKU 分离版本。',
                  // content:
                  //   '将复制当前配置及其关联的 EQ 配置、提示音配置和 APP 资源。副本名称会添加“_副本”，配置版本会生成不重复的副本版本；所有副本均禁用并清空固件包及 SKU 分离版本。',
                  content: '',
                  okText: '创建副本',
                  cancelText: '取消',
                  onOk: () => duplicateSubtree(record),
                });
              };

              return (
                <Space size={8} wrap={false} style={{ whiteSpace: 'nowrap' }}>
                  {/* 历史版本：分类（CATEGORY）类型下提供“新建子节点”，分类类型已废弃 */}
                  {/* {record.type === OtaConfigType.CATEGORY && (
                    <Add
                      reload={actionRef.current?.reload}
                      initParam={{
                        parentUuid: record.uuid,
                        parentName: record.name,
                      }}
                    />
                  )} */}
                  {record.type === OtaConfigType.CONFIG && <EQ otaConfigUuid={record.uuid} />}
                  {record.type === OtaConfigType.CONFIG && <Voice otaConfigUuid={record.uuid} />}
                  <Button
                    type="primary"
                    loading={duplicatingUuid === record.uuid}
                    disabled={Boolean(duplicatingUuid)}
                    onClick={duplicateConfirm}
                  >
                    创建副本
                  </Button>
                  <Add
                    reload={actionRef.current?.reload}
                    data={{
                      ...record,
                    }}
                  />
                  {/* 历史版本：Modal.confirm 居中弹窗（含下级节点时期文案），保留备查 */}
                  {/* const deleteConfirm = () => {
                    Modal.confirm({
                      // title: `确定删除 ${record.name} 吗？`,
                      // content: '删除后下级节点将一并删除，无法恢复。请谨慎处理，普通情况禁用即可',
                      title: '确定删除吗?',
                      okText: '确定',
                      cancelText: '取消',
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        await deleteOtaConfigRun(record.uuid);
                      },
                    });
                  }; */}
                  <Popconfirm
                    // 历史文案（分类树结构时期，含下级节点表述），保留备查
                    // title={`确定删除 ${record.name} 吗？`}
                    // description="删除后下级节点将一并删除，无法恢复。请谨慎处理，普通情况禁用即可"
                    title="确定删除吗?"
                    okText="确定"
                    cancelText="取消"
                    okButtonProps={{
                      danger: true,
                      loading: deleteLoading[record.uuid],
                    }}
                    overlayStyle={{ width: 200 }}
                    onConfirm={() => {
                      // 弹层会立即关闭，loading 挡不住重复点击，手动拦截同 uuid 并发请求
                      if (deleteLoading[record.uuid]) return;
                      handleDelete(record.uuid);
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
        scroll={{ x: 'max-content' }}
      />
    </PageContainer>
  );
};
