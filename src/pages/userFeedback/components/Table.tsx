import { ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Form,
  Grid,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { GetFeedbackRes } from '@/services/modules/user-feedback';
import {
  getFeedbackAll,
  patchFeedbackProblemType,
  patchFeedbackReply,
  ProblemTypeLabel,
  ProblemTypes,
} from '@/services/modules/user-feedback';
import { completeImgUrl } from '@/utils/utils';
import { usePageContext } from '../context/PageContext';

const DEFAULT_REPLY = '已收到，后续固件会更新修复该问题。谢谢您的反馈，祝您生活愉快。';

const QUICK_REPLIES: { text: string; color: string }[] = [
  { text: DEFAULT_REPLY, color: '#52c41a' },
  {
    text: '感谢宝贵建议！我们已经记录，会给到产品团队评估后续迭代规划。',
    color: '#1677ff',
  },
];

export default function UserFeedbackTable() {
  const { md } = Grid.useBreakpoint();
  const {
    searchParams,
    pagination,
    setPagination,
    reloadVersion,
    deletingId,
    openDel,
    setReloadVersion,
  } = usePageContext();

  const [replyForm] = Form.useForm<{ reply: string }>();
  const [replyTarget, setReplyTarget] = useState<{ uuid: string; reply?: string } | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  // 修改问题类型（inline Select），记录正在修改的 uuid 防止并发
  const [typeEditingUuid, setTypeEditingUuid] = useState<string | null>(null);
  const [typeLoadingUuid, setTypeLoadingUuid] = useState<string | null>(null);

  const openReply = (record: GetFeedbackRes) => {
    setReplyTarget({ uuid: record.uuid, reply: record.reply });
  };

  useEffect(() => {
    if (replyTarget) {
      replyForm.setFieldsValue({ reply: replyTarget.reply ?? '' });
    }
  }, [replyTarget, replyForm]);

  const submitReply = async () => {
    const values = await replyForm.validateFields();
    setReplyLoading(true);
    try {
      await patchFeedbackReply(replyTarget!.uuid, values.reply);
      message.success('回复成功');
      setReplyTarget(null);
      setReloadVersion((v) => v + 1);
    } finally {
      setReplyLoading(false);
    }
  };

  const params = useMemo(() => {
    return {
      ...searchParams,
      pageIndex: pagination.current,
      pageSize: pagination.pageSize,
    };
  }, [searchParams, pagination.current, pagination.pageSize]);

  const { data, loading } = useRequest(
    () => {
      return getFeedbackAll(params);
    },
    {
      refreshDeps: [params, reloadVersion],
    },
  );

  useEffect(() => {
    setPagination((prev) => {
      const total = data?.total ?? 0;
      if (prev.total === total) {
        return prev;
      }

      return {
        ...prev,
        total,
      };
    });
  }, [data, setPagination]);

  const tabData = useMemo(() => data?.list ?? [], [data]);

  return (
    <>
      <ProTable<GetFeedbackRes>
        loading={loading}
        rowKey="uuid"
        dataSource={tabData}
        pagination={{
          ...pagination,

          onChange: (page: number, pageSize: number) => {
            setPagination((prev) => ({
              ...prev,
              current: page,
              pageSize,
            }));
          },
        }}
        search={false}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            width: 60,
            render: (_, __, index) => index + 1,
          },
          {
            align: 'left',
            title: '用户名',
            dataIndex: 'username',
            width: 100,
          },
          {
            align: 'left',
            title: '产品型号',
            width: md ? 200 : 160,
            render: (_, record) =>
              record.product ? `${record.product.model} ${record.product.name ?? ''}` : '--',
          },
          {
            align: 'left',
            title: '固件版本号',
            dataIndex: 'otaversion',
            width: 120,
          },
          {
            align: 'left',
            title: '设备型号',
            dataIndex: 'phoneinfo',
            width: 120,
          },
          {
            align: 'left',
            title: 'APP版本号',
            dataIndex: 'appversion',
            width: 100,
          },
          {
            align: 'left',
            title: '内容',
            dataIndex: 'content',
            width: 400,
            render: (_, record) => {
              const str = record.content || '';
              if (!str) return '--';
              return <span style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{str}</span>;
            },
          },
          {
            align: 'left',
            title: '问题类型',
            dataIndex: 'problemType',
            width: 140,
            render: (_, record) => {
              const val = record.problemType ?? '';
              const label = ProblemTypeLabel[val] || val;
              const colorMap: Record<string, string> = {
                connectivity: 'blue',
                crash: 'red',
                audio: 'purple',
                ota: 'cyan',
                dual_device: 'geekblue',
                touch_control: 'orange',
                dsp: 'gold',
                ai_tuning: 'magenta',
                battery: 'green',
                account: 'lime',
                ui_ux: 'volcano',
                feature_request: 'blue',
                other: 'default',
              };
              const color = colorMap[val] || 'default';

              // 编辑态
              if (typeEditingUuid === record.uuid) {
                return (
                  <Select
                    size="small"
                    autoFocus
                    defaultOpen
                    defaultValue={val}
                    loading={typeLoadingUuid === record.uuid}
                    style={{ width: '100%' }}
                    options={ProblemTypes.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    }))}
                    onChange={async (newType) => {
                      setTypeLoadingUuid(record.uuid);
                      try {
                        if (newType !== val) {
                          await patchFeedbackProblemType(record.uuid, newType);
                          message.success('已修改');
                          setReloadVersion((v) => v + 1);
                        }
                      } catch {
                        message.error('修改失败');
                      } finally {
                        setTypeLoadingUuid(null);
                        setTypeEditingUuid(null);
                      }
                    }}
                    onBlur={() => setTypeEditingUuid(null)}
                  />
                );
              }

              // 展示态：点击进入编辑
              if (!label) return <Tag>--</Tag>;
              return (
                <Tag
                  color={color}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setTypeEditingUuid(record.uuid)}
                >
                  {label}
                </Tag>
              );
            },
          },
          {
            align: 'left',
            title: '左耳序列号',
            dataIndex: 'snLeft',
            width: 120,
          },
          {
            align: 'left',
            title: '右耳序列号',
            dataIndex: 'snRight',
            width: 120,
          },
          {
            align: 'center',
            title: '反馈图片',
            dataIndex: 'file',
            width: 120,
            render: (_, record) => {
              if (!record.file) return '--';
              const imgs = record.file.split(',').map((i: string) => {
                let filePath = i;
                if (filePath.endsWith('.heic')) {
                  filePath = `${filePath}?imageMogr2/format/jpg`;
                }
                return completeImgUrl(filePath);
              });
              return (
                <Image.PreviewGroup>
                  {imgs.map((src, idx) => (
                    <Image key={idx} src={src} width={60} style={{ marginRight: 4 }} />
                  ))}
                </Image.PreviewGroup>
              );
            },
          },
          {
            align: 'center',
            title: '发布时间',
            valueType: 'dateTime',
            dataIndex: 'publishTime',
            width: 140,
          },
          {
            align: 'center',
            title: '状态',
            key: 'replyStatus',
            width: 90,
            render: (_, record) =>
              record.reply ? <Tag color="green">已回复</Tag> : <Tag color="orange">待回复</Tag>,
          },
          {
            align: 'left',
            title: '回复',
            dataIndex: 'reply',
            width: 200,
            render: (_, record) => {
              const str = record.reply ?? '';
              if (!str) return '--';
              return <span style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{str}</span>;
            },
          },
          {
            align: 'center',
            title: '操作',
            key: 'option',
            valueType: 'option',
            width: 140,
            render: (_, record) => {
              return (
                <Space direction="horizontal">
                  <Button type="primary" size="small" onClick={() => openReply(record)}>
                    回复
                  </Button>
                  <Popconfirm
                    title="确定删除吗?"
                    onConfirm={async () => {
                      await openDel(record);
                    }}
                  >
                    <Button type="primary" danger size="small" loading={deletingId === record.uuid}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />
      <Modal
        title={replyTarget?.reply ? '修改回复' : '回复'}
        open={!!replyTarget}
        onOk={submitReply}
        onCancel={() => setReplyTarget(null)}
        confirmLoading={replyLoading}
        okText="提交"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={replyForm} layout="vertical">
          <Form.Item
            name="reply"
            label="回复内容"
            rules={[
              { required: true, message: '请输入回复内容' },
              { max: 500, message: '回复内容不能超过 500 字符' },
            ]}
          >
            <Input.TextArea rows={5} maxLength={500} showCount placeholder="请输入回复内容" />
          </Form.Item>
          <Form.Item label="快捷回复">
            <Space wrap>
              {QUICK_REPLIES.map((item, idx) => (
                <Button
                  key={item.text}
                  size="small"
                  style={{
                    borderColor: item.color,
                    color: item.color,
                  }}
                  onClick={() => replyForm.setFieldsValue({ reply: item.text })}
                >
                  {`${idx + 1}. ${
                    item.text.length > 20 ? `${item.text.slice(0, 20)}...` : item.text
                  }`}
                </Button>
              ))}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
