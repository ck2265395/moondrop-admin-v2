import UuidCell from '@/components/UuidCell';
import type {
  GetDongleOtaConfigIndexReq,
  GetDongleOtaConfigIndexRes,
  PostDongleOtaConfigReq,
} from '@/services/modules/dongle-ota-config';
import {
  deleteDongleOtaConfig,
  duplicateDongleOtaConfig,
  getDongleOtaConfigIndex,
  patchDongleOtaConfig,
} from '@/services/modules/dongle-ota-config';
import { getProductAll } from '@/services/modules/product';
import { renderFileIcon, renderIndex, tablePagination } from '@/utils/table';
import { completeImgUrl, getProductModelName } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Grid, message, Modal, Popconfirm, Space, Switch, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import Add from './component/Add';

const getEnableValidationError = (record: GetDongleOtaConfigIndexRes) => {
  if (!record.name.trim() || !record.version.trim()) {
    return '请先填写名称和版本号';
  }
  if (/_副本\d*$/.test(record.name.trim()) || /_副本\d*$/.test(record.version.trim())) {
    return '请先修改名称和版本号，移除“_副本”后缀';
  }
  if (!record.file) {
    return '请先上传固件包';
  }
  return undefined;
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [duplicatingUuid, setDuplicatingUuid] = useState<string>();
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const { md } = Grid.useBreakpoint();

  const duplicateConfig = async (record: GetDongleOtaConfigIndexRes) => {
    setDuplicatingUuid(record.uuid);
    try {
      await duplicateDongleOtaConfig(record.uuid);
      message.success('已创建副本，副本默认禁用且未上传固件包。');
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error && error.message ? `副本创建失败：${error.message}` : '副本创建失败',
      );
    } finally {
      setDuplicatingUuid(undefined);
    }
  };

  const handlePatch = (opt: Partial<PostDongleOtaConfigReq>, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchDongleOtaConfig(opt, uuid)
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
    deleteDongleOtaConfig(uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetDongleOtaConfigIndexRes, GetDongleOtaConfigIndexReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={{
          ...tablePagination,
        }}
        toolBarRender={() => [<Add key="add" reload={actionRef.current?.reload} />]}
        request={(param) => {
          // 搜索列字段名为 key（dongleProductUuidSearch），映射回接口参数 productUuid
          const {
            current,
            pageSize,
            dongleProductUuidSearch: productUuid,
            status,
            name,
          } = param as typeof param & { dongleProductUuidSearch?: string };
          return getDongleOtaConfigIndex({
            pageIndex: current,
            pageSize,
            productUuid,
            status,
            name,
          }).then((res) => ({
            success: true,
            data: res.list,
            total: res.total,
          }));
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
            key: 'dongleProductUuidSearch',
            dataIndex: 'productUuid',
            hideInTable: true,
            request: async () => {
              // 仅展示支持 Dongle（接收器）固件升级的产品
              const res = await getProductAll({});
              return res
                .filter((item) => item.isDongleUpgradable)
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
                  render: (_: unknown, record: GetDongleOtaConfigIndexRes) => {
                    return (
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {getProductModelName(record.product?.model ?? '', record.product?.name)}
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
            align: 'center',
            title: '版本号',
            dataIndex: 'version',
            width: 120,
            search: false,
          },
          {
            align: 'center',
            title: '固件包',
            dataIndex: 'file',
            search: false,
            width: 80,
            render: (_: unknown, record: GetDongleOtaConfigIndexRes) => {
              const { file } = record;
              if (file) {
                return (
                  <Tooltip title={file}>
                    <a href={completeImgUrl(file)} target="_blank" rel="noreferrer">
                      {renderFileIcon(file, 24)}
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
            title: '状态',
            key: 'status2',
            width: 90,
            search: false,
            render: (_, record) => {
              return (
                <Switch
                  checked={record.status === 1}
                  checkedChildren="开启"
                  unCheckedChildren="禁用"
                  loading={patchLoading[record.uuid]}
                  onChange={(checked) => {
                    if (checked) {
                      const validationError = getEnableValidationError(record);
                      if (validationError) {
                        message.warning(validationError);
                        return;
                      }
                    }
                    handlePatch({ status: checked ? 1 : 0 }, record.uuid);
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
            width: md ? 250 : 200,
            render: (_, record) => {
              const duplicateConfirm = () => {
                Modal.confirm({
                  title: `创建「${record.name}」的副本？`,
                  content:
                    '将复制当前配置（不含固件包）。副本名称与版本号会添加“_副本”后缀，副本默认禁用。',
                  okText: '创建副本',
                  cancelText: '取消',
                  onOk: () => duplicateConfig(record),
                });
              };
              return (
                <Space size={8} wrap={false} style={{ whiteSpace: 'nowrap' }}>
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
                  <Popconfirm
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
