import {
  autoTagApply,
  autoTagPreview,
  ProblemTypeLabel,
  ProblemTypes,
  type AutoTagPreviewItem,
} from '@/services/modules/user-feedback';
import { useRequest } from 'ahooks';
import {
  Button,
  Checkbox,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

const { Paragraph } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// predictedType -> tag 颜色（与 Table.tsx 保持一致）
const TAG_COLORS: Record<string, string> = {
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

const AutoTagModal: React.FC<Props> = ({ visible, onCancel, onSuccess }) => {
  // 用户在前端覆盖的预测类型：uuid -> ProblemType
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  // 默认勾选的 uuid（非 OTHER）
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());

  const {
    data,
    loading,
    run: loadPreview,
  } = useRequest(autoTagPreview, {
    manual: true,
    onSuccess: (res) => {
      const set = new Set<string>();
      res.list.forEach((it) => {
        if (it.predictedType !== 'other') set.add(it.uuid);
      });
      setSelectedUuids(set);
      setOverrides({});
    },
  });

  const [applyLoading, setApplyLoading] = useState(false);

  // 分批提交：避免单次 body 过大触发 NestJS 默认 100KB 限制
  const BATCH_SIZE = 500;

  const handleApply = async () => {
    const allItems = Array.from(selectedUuids).map((uuid) => {
      const item = list.find((it) => it.uuid === uuid)!;
      return { uuid, problemType: effectiveType(item) };
    });

    setApplyLoading(true);
    let updated = 0;
    let skipped = 0;
    const tagged: Record<string, number> = {};
    const failedBatches: number[] = [];

    // 串行分批调用，避免并发把数据库压垮
    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
      const batch = allItems.slice(i, i + BATCH_SIZE);
      try {
        const res = await autoTagApply(batch);
        updated += res.updated;
        skipped += res.skipped;
        Object.entries(res.tagged).forEach(([k, v]) => {
          tagged[k] = (tagged[k] || 0) + v;
        });
      } catch {
        failedBatches.push(Math.floor(i / BATCH_SIZE) + 1);
      }
    }
    setApplyLoading(false);

    const failMsg = failedBatches.length
      ? `，其中 ${failedBatches.length} 批失败（批次 ${failedBatches.join('、')}）`
      : '';
    message.success(`已回写 ${updated} 条${failMsg}`);

    onCancel();
    onSuccess();
  };

  useEffect(() => {
    if (visible) loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const list = data?.list ?? [];

  // 当前生效类型 = 用户覆盖值 ?? 预测值
  const effectiveType = (item: AutoTagPreviewItem) => overrides[item.uuid] ?? item.predictedType;

  // 当前可勾选：用户改成 OTHER 也不阻止（尊重用户选择）
  // 默认勾选非 OTHER，但用户手动改过的允许任意选择
  const selectableList = list; // 全部都可勾
  const allChecked = selectableList.length > 0 && selectedUuids.size === selectableList.length;

  const toggleOne = (uuid: string, checked: boolean) => {
    const next = new Set(selectedUuids);
    if (checked) next.add(uuid);
    else next.delete(uuid);
    setSelectedUuids(next);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedUuids(new Set(list.map((it) => it.uuid)));
    } else {
      setSelectedUuids(new Set());
    }
  };

  // 修改覆盖类型
  const changeType = (uuid: string, type: string) => {
    setOverrides((prev) => ({ ...prev, [uuid]: type }));
    // 默认勾上该行，避免改完忘记勾选
    setSelectedUuids((prev) => {
      const next = new Set(prev);
      next.add(uuid);
      return next;
    });
  };

  // 顶部统计：按当前生效类型（含用户覆盖）实时更新
  const stats = useMemo(() => {
    const tagged = {} as Record<string, number>;
    let other = 0;
    list.forEach((it) => {
      const type = effectiveType(it);
      if (type === 'other') other++;
      else tagged[type] = (tagged[type] || 0) + 1;
    });
    return { tagged, other };
    // overrides 也要进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, overrides]);

  return (
    <Modal
      title="自动打标预览（problem_type 为空的历史数据）"
      open={visible}
      onCancel={onCancel}
      width={1000}
      destroyOnHidden
      footer={
        <Space>
          <span style={{ marginRight: 'auto', color: '#888' }}>
            已选 {selectedUuids.size} / 共 {list.length}
            {`（当前 OTHER：${stats.other} 条）`}
          </span>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            loading={applyLoading}
            disabled={selectedUuids.size === 0}
            onClick={handleApply}
          >
            应用选中（{selectedUuids.size} 条）
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {data && (
          <div style={{ marginBottom: 16 }}>
            <Space size={[8, 8]} wrap>
              <span>共 {data.total} 条空数据</span>
              <span>·</span>
              <span>命中分布（实时按当前类型计算）：</span>
              {Object.entries(stats.tagged).map(([type, cnt]) => (
                <Tag key={type} color={TAG_COLORS[type] ?? 'default'}>
                  {ProblemTypeLabel[type] ?? type}: {cnt}
                </Tag>
              ))}
              <Tag color="default">其他: {stats.other}</Tag>
            </Space>
          </div>
        )}

        <Table<AutoTagPreviewItem>
          rowKey="uuid"
          size="small"
          dataSource={list}
          pagination={{ pageSize: 50, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ y: 400 }}
          columns={[
            {
              title: (
                <Checkbox
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={loading || list.length === 0}
                />
              ),
              dataIndex: '__checked',
              width: 50,
              render: (_, record) => (
                <Checkbox
                  checked={selectedUuids.has(record.uuid)}
                  onChange={(e) => toggleOne(record.uuid, e.target.checked)}
                />
              ),
            },
            {
              title: '问题类型',
              dataIndex: 'predictedType',
              width: 180,
              render: (_: string, record) => {
                const type = effectiveType(record);
                const isOverridden = !!overrides[record.uuid];
                return (
                  <Select
                    size="small"
                    style={{ width: '100%' }}
                    value={type}
                    onChange={(v) => changeType(record.uuid, v)}
                    options={ProblemTypes.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    }))}
                    tagRender={(props) => {
                      const color = TAG_COLORS[props.value] ?? 'default';
                      return (
                        <Tag color={color} style={{ margin: 0 }}>
                          {props.label}
                          {isOverridden ? ' *' : ''}
                        </Tag>
                      );
                    }}
                  />
                );
              },
            },
            {
              title: '内容',
              dataIndex: 'content',
              render: (val: string) => (
                <Tooltip title={val} placement="topLeft">
                  <Paragraph
                    style={{ margin: 0, maxHeight: 60, overflow: 'hidden' }}
                    ellipsis={{ rows: 2 }}
                  >
                    {val}
                  </Paragraph>
                </Tooltip>
              ),
            },
          ]}
        />
      </Spin>
    </Modal>
  );
};

export default AutoTagModal;
