import UuidCell from '@/components/UuidCell';
import type { GetPeqConfigAllReq, GetPeqConfigRes } from '@/services/modules/peq-config';
import { deletePeqConfig, getPeqConfigAll, patchPeqConfig } from '@/services/modules/peq-config';
import type { GetPeqConfigCommentAllRes } from '@/services/modules/peq-config-comment';
import {
  deletePeqConfigComment,
  getPeqConfigCommentAll,
  patchPeqConfigComment,
} from '@/services/modules/peq-config-comment';
import { getPeqConfigTagAdminList, TagTypeLabel } from '@/services/modules/peq-config-tag-admin';
import { getProductAll } from '@/services/modules/product';
import { peqType } from '@/utils/data';
import { pageToTable, tablePagination } from '@/utils/table';
import { completeImgUrl, getProductModelName } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Grid, message, Modal, Popconfirm, Space, Switch, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import Add from './component/Add';
const { Paragraph } = Typography;

const peqTypeValueEnum = peqType.$list().reduce<Record<string, string>>((res, item) => {
  res[item.key] = item.value;
  return res;
}, {});

/** 评论列表弹窗：在配置列表页点击评论数 > 0 时弹出，分页展示该配置的评论 */
const CommentListModal = ({
  peqConfigUuid,
  peqConfigTitle,
  visible,
  onClose,
  onCommentCountChange,
}: {
  peqConfigUuid?: string;
  peqConfigTitle?: string;
  visible: boolean;
  onClose: () => void;
  onCommentCountChange?: (nextCount: number) => void;
}) => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const handlePatch = (status: boolean, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchPeqConfigComment({ status }, uuid)
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
    deletePeqConfigComment(uuid)
      .then(() => {
        message.success('删除成功');
        // 刷新弹窗内的评论列表
        actionRef.current?.reload();
        // 通知外层配置列表更新评论数（粗略：当前数 - 1，由外层 reload 拿准确值）
        onCommentCountChange?.(-1);
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <Modal
      title={`评论列表${peqConfigTitle ? ` - ${peqConfigTitle}` : ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <ProTable<GetPeqConfigCommentAllRes, { peqConfigUuid?: string }>
        actionRef={actionRef}
        rowKey="uuid"
        search={false}
        options={false}
        pagination={{
          pageSize,
          showSizeChanger: false,
        }}
        toolBarRender={false}
        request={(params) => {
          setCurrentPage(params.current ?? 1);
          setPageSize(params.pageSize ?? 10);
          if (!peqConfigUuid) {
            return Promise.resolve({ success: true, data: [] });
          }
          return getPeqConfigCommentAll({
            peqConfigUuid,
            pageIndex: params.current,
            pageSize: params.pageSize,
          }).then(pageToTable);
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
          },
          { align: 'center', title: '昵称', dataIndex: 'nickname', width: 100 },
          { align: 'left', title: '评论', dataIndex: 'comment', ellipsis: true },
          { align: 'center', title: '评分', dataIndex: 'score', width: 60 },
          {
            align: 'center',
            title: '时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            width: 140,
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            width: 80,
            render: (_, record) => (
              <Switch
                checked={record.status}
                loading={patchLoading[record.uuid]}
                onChange={() => handlePatch(!record.status, record.uuid)}
              />
            ),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 80,
            render: (_, record) => (
              <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.uuid)}>
                <Button danger type="primary" size="small" loading={deleteLoading[record.uuid]}>
                  删除
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default () => {
  const { md } = Grid.useBreakpoint();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [commentTarget, setCommentTarget] = useState<{
    uuid: string;
    title?: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deletePeqConfig(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };
  const handlePatch = (status: number, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchPeqConfig({ status }, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setPatchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetPeqConfigRes, GetPeqConfigAllReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        tableLayout="fixed"
        search={{
          defaultCollapsed: false,
          span: {
            xs: 24,
            sm: 12,
            md: 8,
            lg: 8,
            xl: 8,
            xxl: 6,
          },
          labelWidth: 72,
          collapseRender: false,
        }}
        toolBarRender={() => [<Add key="add" reload={actionRef.current?.reload} />]}
        request={(param) => {
          const { current, pageSize, productUuid, status, keyword, type, username, tagUuid } =
            param;
          return getPeqConfigAll({
            pageIndex: current,
            pageSize,
            productUuid,
            status,
            keyword,
            type,
            username,
            tagUuid,
          }).then(pageToTable);
        }}
        scroll={{ x: 'max-content' }}
        columnsState={{
          defaultValue: {
            independentChannelTuning: { show: false },
          },
        }}
        columns={[
          {
            align: 'center',
            title: '所属产品',
            dataIndex: 'productUuid',
            hideInTable: true,
            fieldProps: {
              showSearch: true,
              optionFilterProp: 'label',
            },
            request: async () => {
              const res = await getProductAll({});
              return res.map((item) => ({
                label: getProductModelName(item.model, item.name),
                value: item.uuid,
              }));
            },
          },
          {
            align: 'center',
            title: '关键词',
            dataIndex: 'keyword',
            hideInTable: true,
          },
          {
            align: 'center',
            title: '标签',
            dataIndex: 'tagUuid',
            hideInTable: true,
            valueType: 'select',
            fieldProps: {
              showSearch: true,
              optionFilterProp: 'label',
              allowClear: true,
              placeholder: '请选择标签',
            },
            request: async () => {
              // 加载启用的标签列表（按 type 分组，展示图标）
              const res = await getPeqConfigTagAdminList();
              const groups: Record<string, { label: ReactNode; value: string }[]> = {};
              res.forEach((tag) => {
                const group = TagTypeLabel[tag.type] || tag.type;
                if (!groups[group]) groups[group] = [];
                groups[group].push({
                  label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <img
                        src={completeImgUrl(tag.icon)}
                        alt={tag.title}
                        style={{ width: 18, height: 18, objectFit: 'contain' }}
                      />
                      {tag.title}
                    </span>
                  ),
                  value: tag.uuid,
                });
              });
              return Object.entries(groups).map(([label, options]) => ({
                label,
                options,
              }));
            },
          },
          {
            align: 'center',
            title: '序号',
            key: 'index',
            search: false,
            width: 50,
            render: (val, row, index) => {
              return index + 1;
            },
          },
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
            title: '所属产品',
            dataIndex: 'product',
            search: false,
            width: 180,
            render: (_, record) => {
              return (
                <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {getProductModelName(record.product.model, record.product.name)}
                </span>
              );
            },
          },
          {
            align: 'left',
            title: '标题',
            dataIndex: 'title',
            search: false,
            width: md ? 240 : 180,
            render: (_, record) => (
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                style={{ marginBottom: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
              >
                {record.title}
              </Paragraph>
            ),
          },
          {
            align: 'left',
            title: '类型',
            dataIndex: 'type',
            width: 60,
            valueEnum: peqTypeValueEnum,
          },
          {
            align: 'center',
            title: '来源',
            dataIndex: 'source',
            search: false,
            width: 80,
            render: (_, record) =>
              record.source ? (
                <Tag style={{ margin: 0 }}>
                  {record.source.charAt(0).toUpperCase() + record.source.slice(1)}
                </Tag>
              ) : null,
          },
          {
            align: 'center',
            title: '用户',
            dataIndex: 'username',
            width: 80,
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            hideInTable: true,
            valueEnum: {
              1: '上线',
              0: '下线',
            },
          },
          {
            align: 'left',
            title: '备注',
            search: false,
            dataIndex: 'desc',
            width: md ? 200 : 160,
            render: (_, record) =>
              record.desc ? (
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                  style={{ marginBottom: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  {record.desc}
                </Paragraph>
              ) : (
                '-'
              ),
          },
          // {
          //   align: 'center',
          //   title: '耳机型号',
          //   dataIndex: 'headphoneModel',
          //   search: false,
          //   render: (_, record) => record.headphoneModel?.title || '-',
          // },
          {
            align: 'left',
            title: '标签',
            dataIndex: 'tags',
            search: false,
            width: 120,
            render: (_, record) => {
              if (!record.tags?.length) return '-';
              return (
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {record.tags.map((t: any) => (
                    <Tag key={t.uuid} color="default" style={{ margin: 0 }}>
                      {t.title}
                    </Tag>
                  ))}
                </span>
              );
            },
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            search: false,
            width: 80,
            render: (val, record) => {
              return (
                <Switch
                  checkedChildren="上线"
                  unCheckedChildren="下线"
                  checked={!!val}
                  loading={patchLoading[record.uuid]}
                  onChange={() => {
                    handlePatch(val === 0 ? 1 : 0, record.uuid);
                  }}
                />
              );
            },
          },
          {
            align: 'center',
            title: '独立调音',
            dataIndex: 'independentChannelTuning',
            search: false,
            width: 120,
            render: (_, record) => (record.independentChannelTuning ? '是' : '否'),
          },
          {
            align: 'center',
            title: '评论数',
            dataIndex: 'comment_count',
            search: false,
            width: 70,
            render: (_, record) => {
              const count = record.comment_count ?? 0;
              if (count <= 0) {
                return <span>{count}</span>;
              }
              return (
                <Button
                  type="link"
                  style={{ padding: 0, height: 'auto' }}
                  onClick={() => setCommentTarget({ uuid: record.uuid, title: record.title })}
                >
                  {count}
                </Button>
              );
            },
          },
          {
            align: 'center',
            title: '创建时间',
            dataIndex: 'createTime',
            search: false,
            width: 140,
            valueType: 'dateTime',
          },
          {
            align: 'center',
            title: '操作',
            key: 'option',
            valueType: 'option',
            width: 140,
            render: (_, record) => {
              return (
                <Space direction="horizontal" size={8}>
                  {/* <TAG peqConfigUuid={record.uuid} /> */}
                  <Add
                    reload={actionRef.current?.reload}
                    data={{
                      ...record,
                    }}
                  />
                  <Popconfirm
                    title="确定删除吗?"
                    okButtonProps={{ loading: deleteLoading[record.uuid] }}
                    onConfirm={() => {
                      handleDelete(record.uuid);
                    }}
                  >
                    <Button type="primary" danger loading={deleteLoading[record.uuid]}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />
      <CommentListModal
        peqConfigUuid={commentTarget?.uuid}
        peqConfigTitle={commentTarget?.title}
        visible={!!commentTarget}
        onClose={() => setCommentTarget(null)}
        onCommentCountChange={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};
