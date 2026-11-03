import type {
  ProductSyncAppResourceItem,
  ProductSyncCompareItem,
  ProductSyncOtaConfigItem,
  ProductSyncRelationItem,
} from '@/services/modules/product-sync';
import { postProductSyncCompare, postProductSyncPush } from '@/services/modules/product-sync';
import { SyncOutlined } from '@ant-design/icons';
import { Alert, Button, Card, message, Modal, Space, Spin, Table, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';

const statusMeta = (
  peer: string,
): Record<ProductSyncCompareItem['peerStatus'], { label: string; color: string }> => ({
  missing: { label: `${peer}不存在，可同步`, color: 'green' },
  exists: { label: `${peer}已存在，本次不同步`, color: 'orange' },
  model_conflict: { label: `${peer}存在同型号产品，不同步`, color: 'red' },
});

const SectionTitle = ({ text }: { text: string }) => (
  <Typography.Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
    {text}
  </Typography.Title>
);

const diffTableColumns = (peer: string) => [
  { title: '字段', dataIndex: 'label', width: 140 },
  { title: '本端', dataIndex: 'local', ellipsis: true },
  { title: peer, dataIndex: 'peer', ellipsis: true },
];

/** 关联状态：已存在 / 推送时配置 / 跳过（附原因） */
const RelationTag = ({
  peer,
  peerExists,
  peerRelationExists,
  skipReason,
}: {
  peer: string;
  peerExists: boolean;
  peerRelationExists: boolean;
  skipReason?: string;
}) => {
  const meta = peerExists
    ? peerRelationExists
      ? { color: 'green', text: `${peer}已存在` }
      : { color: 'orange', text: `${peer}缺少关联，推送时配置` }
    : { color: 'red', text: skipReason ?? `${peer}缺失，关联跳过` };
  return <Tag color={meta.color}>{meta.text}</Tag>;
};

/** 关联列表：明确展示「本端产品 ←→ 关联产品」的方向 */
const RelationTable = ({
  peer,
  selfModel,
  relations,
}: {
  peer: string;
  selfModel: string;
  relations: ProductSyncRelationItem[];
}) => (
  <Table
    size="small"
    rowKey="uuid"
    pagination={false}
    dataSource={relations}
    columns={[
      { title: '本端产品', width: 120, render: () => <b>{selfModel}</b> },
      {
        title: '关联产品',
        dataIndex: 'model',
        render: (_, relation: ProductSyncRelationItem) => (
          <span>
            {relation.model}
            {relation.name ? `（${relation.name}）` : ''}
          </span>
        ),
      },
      {
        title: `${peer}状态`,
        dataIndex: 'peerExists',
        width: 240,
        render: (_, relation: ProductSyncRelationItem) => (
          <RelationTag
            peer={peer}
            peerExists={relation.peerExists}
            peerRelationExists={relation.peerRelationExists}
            skipReason={relation.skipReason}
          />
        ),
      },
    ]}
  />
);

/** OTA/Dongle 配置列表：缺失写入、已存在列差异但跳过 */
const OtaConfigTable = ({
  peer,
  configs,
}: {
  peer: string;
  configs: ProductSyncOtaConfigItem[];
}) => (
  <Table
    size="small"
    rowKey="uuid"
    pagination={false}
    dataSource={configs}
    expandable={{
      rowExpandable: (r) => r.fieldDiffs.length > 0,
      expandedRowRender: (r) => (
        <Table
          size="small"
          rowKey="key"
          pagination={false}
          columns={diffTableColumns(peer)}
          dataSource={r.fieldDiffs}
        />
      ),
    }}
    columns={[
      { title: '名称', dataIndex: 'name', ellipsis: true },
      { title: '版本号', dataIndex: 'version', width: 120 },
      {
        title: `${peer}状态`,
        width: 180,
        render: (_, r: ProductSyncOtaConfigItem) =>
          r.peerStatus === 'missing' ? (
            <Tag color="green">{peer}缺失，推送时写入</Tag>
          ) : (
            <Tag color="orange">
              {peer}已存在，跳过{r.fieldDiffs.length ? '（有差异）' : ''}
            </Tag>
          ),
      },
    ]}
  />
);

/** 冲突资源表（对端同名但uuid不一致）：父链对比 + 管理员选择关联对端资源或跳过；未确认行高亮提示 */
const ConflictResourceTable = ({
  peer,
  resources,
  choices,
  onChange,
}: {
  peer: string;
  resources: ProductSyncAppResourceItem[];
  choices: Record<string, 'peer' | 'skip'>;
  onChange: (uuid: string, value: 'peer' | 'skip') => void;
}) => (
  <Table
    size="small"
    rowKey="uuid"
    pagination={false}
    dataSource={resources}
    onRow={(r: ProductSyncAppResourceItem) => ({
      style: {
        backgroundColor: choices[r.uuid] ? '#f6ffed' : '#fff7e6',
      },
    })}
    columns={[
      {
        title: '本端资源',
        render: (_, r: ProductSyncAppResourceItem) => (
          <div>
            <b>{r.name}</b>
            <div style={{ color: '#999', fontSize: 12 }}>
              父链：{r.ancestorNames?.length ? r.ancestorNames.join(' / ') : '-'}
            </div>
          </div>
        ),
      },
      {
        title: `${peer}资源（在用，不同步本体）`,
        render: (_, r: ProductSyncAppResourceItem) => (
          <div>
            <b>{r.peerName || '-'}</b>
            <div style={{ color: '#999', fontSize: 12 }}>uuid: {r.peerUuid}</div>
            <div style={{ color: '#999', fontSize: 12 }}>
              父链：{r.peerAncestorNames?.length ? r.peerAncestorNames.join(' / ') : '-'}
            </div>
          </div>
        ),
      },
      {
        title: '处理方式',
        width: 250,
        render: (_, r: ProductSyncAppResourceItem) => {
          const choice = choices[r.uuid];
          return (
            <Space size={8}>
              {/* 双按钮代替 Radio/Segmented：无预选中态，点击即选中 */}
              <Button
                size="small"
                type={choice === 'skip' ? 'primary' : 'default'}
                onClick={() => onChange(r.uuid, 'skip')}
              >
                跳过关联
              </Button>
              <Button
                size="small"
                type={choice === 'peer' ? 'primary' : 'default'}
                danger={choice === 'peer'}
                onClick={() => onChange(r.uuid, 'peer')}
              >
                关联对端
              </Button>
              {!choice && <Tag color="orange">待确认</Tag>}
            </Space>
          );
        },
      },
    ]}
  />
);

const CompareItemBlock = memo(
  ({
    item,
    peerName,
    resourceChoices,
    onResourceChoice,
  }: {
    item: ProductSyncCompareItem;
    peerName: string;
    resourceChoices: Record<string, 'peer' | 'skip'>;
    onResourceChoice: (uuid: string, value: 'peer' | 'skip') => void;
  }) => {
    // 对端存在同名但uuid不同的芯片：产品跳过同步，卡片标红
    const chipConflict = item.peerStatus === 'missing' && item.chip.status === 'name_conflict';
    const meta = chipConflict
      ? { label: `${peerName}存在同名芯片，跳过同步`, color: 'red' }
      : statusMeta(peerName)[item.peerStatus];
    return (
      <Card
        size="small"
        style={{ borderColor: meta.color }}
        styles={{ body: { paddingTop: 12 } }}
        title={
          <Space size={8} wrap>
            <Tag color={meta.color}>{meta.label}</Tag>
            <b>{item.model}</b>
            <span style={{ fontWeight: 400, color: '#666' }}>{item.name || '-'}</span>
          </Space>
        }
      >
        {item.warnings.map((warning) => (
          <Alert
            key={warning}
            type={item.peerStatus === 'missing' ? 'warning' : 'info'}
            showIcon
            message={warning}
            style={{ marginBottom: 4 }}
          />
        ))}

        {item.peerStatus === 'exists' && (
          <>
            <SectionTitle text={`产品字段差异（本端 vs ${peerName}，仅展示不覆盖）`} />
            {item.productFieldDiffs.length ? (
              <Table
                size="small"
                rowKey="key"
                pagination={false}
                columns={diffTableColumns(peerName)}
                dataSource={item.productFieldDiffs}
              />
            ) : (
              <div style={{ color: '#999' }}>字段完全一致</div>
            )}
          </>
        )}

        {item.peerStatus === 'missing' && (
          <>
            <SectionTitle text="芯片" />
            <div>
              本端：<b>{item.chip.localName || '-'}</b>
              <br />
              {peerName}：
              {item.chip.status === 'match'
                ? item.chip.peerName || '-'
                : item.chip.status === 'missing'
                ? `缺失 ${
                    item.chip.missingAncestors.length
                  } 个节点（推送时自动补齐）：${item.chip.missingAncestors
                    .map((m) => m.name)
                    .join('、')}`
                : item.chip.status === 'name_conflict'
                ? `存在同名但uuid不同的芯片：${item.chip.nameConflicts
                    .map((c) => `${c.name}（对端uuid: ${c.peerUuid}）`)
                    .join('、')}，产品跳过同步`
                : '与本端不一致，跳过补齐'}
            </div>

            {!chipConflict && (
              <>
                <SectionTitle text="SKU（颜色版本）" />
                <div>
                  共 {item.sku.localCount} 个，推送时全量写入
                  {item.sku.codes.length > 0 && `：${item.sku.codes.join('、')}`}
                </div>

                <SectionTitle text="OTA配置" />
                {item.otaConfigs.length ? (
                  <OtaConfigTable peer={peerName} configs={item.otaConfigs} />
                ) : (
                  <div style={{ color: '#999' }}>无</div>
                )}

                <SectionTitle text="Dongle配置" />
                {item.dongleConfigs.length ? (
                  <OtaConfigTable peer={peerName} configs={item.dongleConfigs} />
                ) : (
                  <div style={{ color: '#999' }}>无</div>
                )}

                {item.appResources.length > 0 && (
                  <>
                    <SectionTitle text="功能配置引用的APP资源" />
                    {item.appResources.some((r) => r.peerStatus !== 'conflict') && (
                      <Space size={4} wrap>
                        {item.appResources
                          .filter((r) => r.peerStatus !== 'conflict')
                          .map((r) => (
                            <Tag
                              key={r.uuid}
                              color={r.peerStatus === 'exists' ? 'green' : 'orange'}
                            >
                              {r.name}
                              {r.peerStatus === 'missing' &&
                                (r.missingAncestors?.length
                                  ? `（将自动同步，补父链：${r.missingAncestors
                                      .map((m) => m.name)
                                      .join('、')}）`
                                  : r.ancestorNames?.length
                                  ? `（将自动同步，父链 ${r.ancestorNames.join('/')} 已存在）`
                                  : '（将自动同步）')}
                            </Tag>
                          ))}
                      </Space>
                    )}
                    {item.appResources.some((r) => r.peerStatus === 'conflict') && (
                      <>
                        <Alert
                          type="warning"
                          showIcon
                          style={{ margin: '4px 0' }}
                          message={`${peerName}已存在同名但uuid不一致的资源（有固件/产品在使用，不会同步本体）。每个冲突资源必须选择处理方式后才能推送：关联对端资源（推送时功能配置直接关联到对端资源）或跳过关联（推送后请自行在对端配置关联）`}
                        />
                        <ConflictResourceTable
                          peer={peerName}
                          resources={item.appResources.filter((r) => r.peerStatus === 'conflict')}
                          choices={resourceChoices}
                          onChange={onResourceChoice}
                        />
                      </>
                    )}
                  </>
                )}

                <SectionTitle text="产品关联" />
                {item.productRelations.length ? (
                  <RelationTable
                    peer={peerName}
                    selfModel={item.model}
                    relations={item.productRelations}
                  />
                ) : (
                  <div style={{ color: '#999' }}>无</div>
                )}

                <SectionTitle text="OTA关联" />
                {item.otaRelations.length ? (
                  <RelationTable
                    peer={peerName}
                    selfModel={item.model}
                    relations={item.otaRelations}
                  />
                ) : (
                  <div style={{ color: '#999' }}>无</div>
                )}
              </>
            )}
          </>
        )}
      </Card>
    );
  },
);

const Sync = ({
  uuids,
  onClose,
}: {
  uuids?: string[];
  onClose?: (needReload?: boolean) => void;
}) => {
  const [comparing, setComparing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [items, setItems] = useState<ProductSyncCompareItem[]>([]);
  const [peerConfigured, setPeerConfigured] = useState(true);
  const [peerName, setPeerName] = useState('对端');
  // 冲突APP资源处理选择（key=本端资源uuid，value=peer-关联对端资源/skip-跳过），默认跳过
  const [resourceChoices, setResourceChoices] = useState<Record<string, 'peer' | 'skip'>>({});
  // 关闭动画期间保留内容，动画结束后再清空，避免关闭时重渲染卡顿
  const [innerUuids, setInnerUuids] = useState<string[]>();

  const handleResourceChoice = useCallback((uuid: string, value: 'peer' | 'skip') => {
    setResourceChoices((prev) => ({ ...prev, [uuid]: value }));
  }, []);

  useEffect(() => {
    if (uuids?.length) setInnerUuids(uuids);
  }, [uuids]);

  const runCompare = (target?: string[]) => {
    const list = target ?? innerUuids;
    if (!list?.length) return;
    setItems([]);
    setResourceChoices({});
    setComparing(true);
    postProductSyncCompare({ uuids: list })
      .then((res) => {
        setPeerConfigured(res.peerConfigured);
        setPeerName(res.peerName || '对端');
        setItems(res.items);
      })
      .catch(() => onClose?.())
      .finally(() => setComparing(false));
  };

  const runPush = () => {
    if (!innerUuids?.length) return;
    setPushing(true);
    const usePeerResourceUuids = Object.entries(resourceChoices)
      .filter(([, value]) => value === 'peer')
      .map(([key]) => key);
    postProductSyncPush({ uuids: innerUuids, usePeerResourceUuids })
      .then((res) => {
        const skippedText = res.skippedProducts?.length
          ? `；未推送：${res.skippedProducts.join('、')}`
          : '';
        const otaText = res.pushedOtaConfigs ? `，OTA配置 ${res.pushedOtaConfigs} 个` : '';
        const dongleText = res.pushedDongleConfigs
          ? `，Dongle配置 ${res.pushedDongleConfigs} 条`
          : '';
        const peerResourceText = res.relatedPeerResources
          ? `，采用对端资源关联 ${res.relatedPeerResources} 条`
          : '';
        message.success(
          `推送完成：新增产品 ${res.pushed} 个${otaText}${dongleText}${peerResourceText}，跳过关联 ${res.skippedRelations} 条，跳过功能配置关联 ${res.skippedOtaResources} 条${skippedText}`,
        );
        onClose?.(true);
      })
      .finally(() => setPushing(false));
  };

  // 打开弹窗自动对比
  useEffect(() => {
    if (uuids?.length) {
      setPeerConfigured(true);
      setInnerUuids(uuids);
      runCompare(uuids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuids]);

  const canPush = items.some((item) => item.canSync);
  // 存在冲突APP资源（对端同名不同uuid）时：每个冲突项必须由用户明确做出选择
  //（选「关联对端资源」或保持「跳过关联」后确认），否则推送按钮置灰
  const conflictUuids = items.flatMap((item) =>
    item.appResources.filter((r) => r.peerStatus === 'conflict').map((r) => r.uuid),
  );
  const hasUnresolvedConflict = conflictUuids.some((uuid) => !resourceChoices[uuid]);

  return (
    <Modal
      title={`推送到${peerName}（${innerUuids?.length ?? 0} 个产品）`}
      open={!!uuids?.length}
      afterClose={() => {
        setInnerUuids(undefined);
        setItems([]);
        setResourceChoices({});
      }}
      width={720}
      maskClosable={false}
      onCancel={() => onClose?.()}
      footer={
        peerConfigured
          ? [
              <Button key="cancel" onClick={() => onClose?.()}>
                关闭
              </Button>,
              <Button
                key="compare"
                icon={<SyncOutlined />}
                loading={comparing}
                onClick={() => runCompare()}
              >
                重新对比
              </Button>,
              <Button
                key="push"
                type="primary"
                disabled={!canPush || hasUnresolvedConflict}
                title={
                  hasUnresolvedConflict
                    ? '存在未处理的同名APP资源冲突，请在资源列表中选择处理方式'
                    : undefined
                }
                loading={pushing}
                onClick={runPush}
              >
                确认推送
              </Button>,
            ]
          : [
              <Button key="cancel" type="primary" onClick={() => onClose?.()}>
                关闭
              </Button>,
            ]
      }
    >
      <Spin spinning={comparing}>
        {!peerConfigured && (
          <Alert
            type="warning"
            showIcon
            message={`${peerName}推送未启用（请配置 PEER_ENABLE=true 及 PEER_PG_* 连接信息）`}
          />
        )}
        {peerConfigured && !items.length && !comparing && (
          <Alert type="info" showIcon message="正在准备对比…" />
        )}
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {items.map((item) => (
            <CompareItemBlock
              key={item.uuid}
              item={item}
              peerName={peerName}
              resourceChoices={resourceChoices}
              onResourceChoice={handleResourceChoice}
            />
          ))}
        </Space>
      </Spin>
    </Modal>
  );
};

export default Sync;
