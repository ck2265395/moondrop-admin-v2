import { getPeqConfigAll } from '@/services/modules/peq-config';
import type {
  GetPeqConfigCommentAllRes,
  PostPeqConfigCommentReq,
} from '@/services/modules/peq-config-comment';
import {
  deletePeqConfigComment,
  getPeqConfigCommentAll,
  patchPeqConfigComment,
  postPeqConfigComment,
} from '@/services/modules/peq-config-comment';
import { pageToTable } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
import {
  DrawerForm,
  PageContainer,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Form,
  Grid,
  message,
  Popconfirm,
  Rate,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 20;

/**
 * 远程搜索 + 滚动分页加载的 PEQ 配置下拉框
 * - 输入关键字（标题/用户名）触发查询
 * - 下拉滚动到底部自动加载下一页
 */
const PeqConfigSelect = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (val: string) => void;
}) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const pageRef = useRef({ pageIndex: 1, hasMore: true });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = async (key: string, pageIndex: number) => {
    setLoading(true);
    try {
      const res = await getPeqConfigAll({
        pageIndex,
        pageSize: PAGE_SIZE,
        keyword: key || undefined,
      });
      const newOpts = res.list.map((item) => ({ label: item.title, value: item.uuid }));
      setOptions((prev) => (pageIndex === 1 ? newOpts : [...prev, ...newOpts]));
      pageRef.current = { pageIndex, hasMore: res.list.length >= PAGE_SIZE };
    } finally {
      setLoading(false);
    }
  };

  // 首屏加载
  useEffect(() => {
    fetchPage('', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (v: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setKeyword(v);
      fetchPage(v, 1);
    }, 300);
  };

  const onPopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 30 && !loading && pageRef.current.hasMore) {
      fetchPage(keyword, pageRef.current.pageIndex + 1);
    }
  };

  return (
    <Select
      showSearch
      filterOption={false}
      onSearch={onSearch}
      onPopupScroll={onPopupScroll}
      loading={loading}
      options={options}
      value={value}
      onChange={onChange}
      placeholder="搜索配置标题/用户名"
      allowClear
    />
  );
};

const EditComment = ({ reload }: { reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<
    PostPeqConfigCommentReq['peqConfigComments'][number] & { peqConfigUuid: string }
  >();
  const { runAsync: postRun } = useRequest(postPeqConfigComment, {
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
      title="新建 PEQ 评论"
      trigger={<Button type="primary">新建</Button>}
      drawerProps={{ width: md ? 460 : '100%', maskClosable: false, getContainer: undefined }}
      initialValues={{ status: true, score: 5 }}
      onFinish={(values) =>
        postRun({
          peqConfigUuid: values.peqConfigUuid,
          peqConfigComments: [
            {
              comment: values.comment,
              nickname: values.nickname,
              profilepic: values.profilepic,
              score: values.score,
              status: values.status,
              userUuid: values.userUuid,
            },
          ],
        })
          .then(() => true)
          .catch(() => false)
      }
    >
      <ProFormText
        name="peqConfigUuid"
        label="PEQ配置 UUID"
        rules={[{ required: true, message: '请输入' }]}
      />
      <ProFormTextArea
        name="comment"
        label="评论"
        rules={[{ required: true, message: '请输入' }]}
      />
      <ProFormText name="nickname" label="昵称" />
      <ProFormText name="profilepic" label="头像" />
      <ProFormText name="userUuid" label="用户 UUID" />
      <ProFormDigit name="score" label="评分" min={0} max={5} />
      <ProFormSwitch name="status" label="状态" checkedChildren="显示" unCheckedChildren="隐藏" />
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetPeqConfigCommentAllRes, { peqConfigUuid?: string }>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, [start, end]) => `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        toolBarRender={() => [<EditComment key="add" reload={actionRef.current?.reload} />]}
        request={(params) => {
          setCurrentPage(params.current ?? 1);
          setPageSize(params.pageSize ?? 20);
          return getPeqConfigCommentAll({
            peqConfigUuid: params.peqConfigUuid,
            pageIndex: params.current,
            pageSize: params.pageSize,
          }).then(pageToTable);
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: 'PEQ配置',
            dataIndex: 'peqConfigUuid',
            hideInTable: true,
            renderFormItem: () => <PeqConfigSelect />,
          },
          {
            align: 'center',
            title: '序号',
            search: false,
            width: 80,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
          },
          {
            align: 'left',
            title: '昵称',
            dataIndex: 'nickname',
            search: false,
            width: 160,
            render: (_, record) => (
              <Tooltip title={record.nickname} placement="topLeft">
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 140 }}
                >
                  {record.profilepic ? (
                    <img
                      src={completeImgUrl(record.profilepic)}
                      alt={record.nickname}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                  <Typography.Text style={{ flex: 1, minWidth: 0 }} ellipsis>
                    {record.nickname}
                  </Typography.Text>
                </span>
              </Tooltip>
            ),
          },
          {
            align: 'left',
            title: '评论',
            dataIndex: 'comment',
            search: false,
            width: 320,
            render: (text) => (
              <Tooltip title={text} placement="topLeft">
                <Typography.Text
                  style={{ maxWidth: 300, display: 'inline-block', verticalAlign: 'middle' }}
                  ellipsis
                >
                  {text}
                </Typography.Text>
              </Tooltip>
            ),
          },
          {
            align: 'center',
            title: '评分',
            dataIndex: 'score',
            search: false,
            render: (_, record) => <Rate disabled allowHalf value={record.score} />,
          },
          {
            align: 'center',
            title: '时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            search: false,
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            search: false,
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
            width: 100,
            render: (_, record) => (
              <Space>
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
