import type { GetOperationLogReq, GetOperationLogRes } from '@/services/modules/operation-log';
import { getOperationLogModules, getOperationLogs } from '@/services/modules/operation-log';
import { completeImgUrl } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const IMAGE_URL_PATTERN =
  /((?:https?:\/\/|\/\/)[^\s]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?|(?:[\w-]+\/)+[\w.-]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?)/gi;

/** 完整 http(s) URL */
const HTTP_URL_PATTERN = /(https?:\/\/[^\s)]+)/gi;

/** CDN 上的文档路径（带扩展名），可带或不带前导斜杠 */
const CDN_PATH_PATTERN =
  /((?:\/)?(?:[\w-]+\/)*[\w.-]+\.(?:html?|pdf|json|txt|xml|md|doc(?:x)?|xls(?:x)?|ppt(?:x)?|csv))/gi;

/** 把路径补成完整可点击 URL，已是 http(s) 则原样返回 */
const toClickableUrl = (src: string): string => {
  if (/^https?:\/\//.test(src)) return src;
  // 统一去掉开头的 /，让 completeImgUrl 正确拼接
  const trimmed = src.replace(/^\/+/, '');
  return completeImgUrl(trimmed);
};

const renderLinkedText = (text: string) => {
  const content: React.ReactNode[] = [];
  let key = 0;

  const segments: { type: 'text' | 'image' | 'url' | 'cdn'; value: string }[] = [];

  // 1. 图片
  let remaining = text;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  IMAGE_URL_PATTERN.lastIndex = 0;
  while ((m = IMAGE_URL_PATTERN.exec(text)) !== null) {
    if (m.index > lastEnd) segments.push({ type: 'text', value: text.slice(lastEnd, m.index) });
    segments.push({ type: 'image', value: m[0] });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) remaining = text.slice(lastEnd);
  else remaining = '';

  // 2. 剩余部分匹配 http URL
  if (remaining) {
    let last = 0;
    HTTP_URL_PATTERN.lastIndex = 0;
    while ((m = HTTP_URL_PATTERN.exec(remaining)) !== null) {
      if (m.index > last) segments.push({ type: 'text', value: remaining.slice(last, m.index) });
      segments.push({ type: 'url', value: m[0] });
      last = m.index + m[0].length;
    }
    if (last < remaining.length) remaining = remaining.slice(last);
    else remaining = '';
  }

  // 3. 剩余部分匹配 CDN 路径
  if (remaining) {
    let last = 0;
    CDN_PATH_PATTERN.lastIndex = 0;
    while ((m = CDN_PATH_PATTERN.exec(remaining)) !== null) {
      if (m.index > last) segments.push({ type: 'text', value: remaining.slice(last, m.index) });
      segments.push({ type: 'cdn', value: m[0] });
      last = m.index + m[0].length;
    }
    if (last < remaining.length) segments.push({ type: 'text', value: remaining.slice(last) });
  }

  for (const seg of segments) {
    if (seg.type === 'text') {
      content.push(seg.value);
      continue;
    }
    if (seg.type === 'image') {
      content.push(
        <a
          key={`image-${key++}`}
          href={completeImgUrl(seg.value)}
          target="_blank"
          rel="noreferrer"
          style={{ margin: '0 4px', verticalAlign: 'middle' }}
          title={seg.value}
        >
          <img
            src={completeImgUrl(seg.value)}
            alt=""
            style={{ height: 60, borderRadius: 4, border: '1px solid #f0f0f0', display: 'block' }}
          />
        </a>,
      );
      continue;
    }
    const url = toClickableUrl(seg.value);
    content.push(
      <a
        key={`link-${key++}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#1890ff', wordBreak: 'break-all' }}
        title={url}
      >
        {seg.value}
      </a>,
    );
  }
  return content;
};

interface SummaryField {
  label: string;
  value: string;
}

/** 清洗 IP 展示：去掉 IPv4-mapped IPv6 等前缀，本地回环地址不显示 */
const formatIp = (ip?: string): string => {
  const value = (ip ?? '').trim();
  if (!value) return '';
  const mapped = value.match(/^::ffff:(.+)$/i);
  const addr = mapped ? mapped[1] : value;
  return addr === '127.0.0.1' ? '' : addr;
};

interface SummaryGroupItem {
  label: string;
  details: SummaryField[];
}

interface SummaryGroup {
  label: string;
  items: SummaryGroupItem[];
}

interface StructuredSummary {
  title: string;
  fields: SummaryField[];
  groups: SummaryGroup[];
}

/** 解析后端 summary 约定格式 */
const parseSummary = (summary: string): StructuredSummary => {
  const lines = summary.split('\n');
  const title = (lines.shift() ?? '').trim();
  const result: StructuredSummary = { title, fields: [], groups: [] };
  let currentGroup: SummaryGroup | null = null;
  let currentItem: SummaryGroupItem | null = null;

  lines.forEach((raw) => {
    if (!raw.trim()) return;

    const groupMatch = raw.match(/^([^-\s][^：]*)：\s*$/);
    if (groupMatch) {
      currentGroup = { label: groupMatch[1].trim(), items: [] };
      currentItem = null;
      result.groups.push(currentGroup);
      return;
    }

    const itemMatch = raw.match(/^-\s+(.*)$/);
    if (itemMatch) {
      const content = itemMatch[1].trim();
      const valueMatch = content.match(/^(.+?)：\s*([\s\S]*)$/);
      if (valueMatch && !valueMatch[2].trim()) {
        currentGroup = { label: valueMatch[1].trim(), items: [] };
        currentItem = null;
        result.groups.push(currentGroup);
      } else if (valueMatch && currentGroup) {
        currentItem = { label: valueMatch[1].trim(), details: [] };
        if (valueMatch[2].trim()) {
          currentItem.details.push({ label: '', value: valueMatch[2].trim() });
        }
        currentGroup.items.push(currentItem);
      } else if (valueMatch) {
        result.fields.push({ label: valueMatch[1].trim(), value: valueMatch[2].trim() });
        currentItem = null;
      } else if (currentGroup) {
        currentItem = { label: content, details: [] };
        currentGroup.items.push(currentItem);
      } else {
        result.fields.push({ label: content, value: '' });
        currentItem = null;
      }
      return;
    }

    const detailMatch = raw.match(/^\s+([^：]+)：\s*(.*)$/);
    if (detailMatch) {
      const field = { label: detailMatch[1].trim(), value: detailMatch[2].trim() };
      if (currentItem) {
        currentItem.details.push(field);
      } else if (currentGroup) {
        currentItem = { label: '', details: [field] };
        currentGroup.items.push(currentItem);
      } else {
        result.fields.push(field);
      }
      return;
    }

    const plain = raw.trim();
    if (currentItem) {
      currentItem.details.push({ label: '', value: plain });
    } else {
      result.fields.push({ label: '', value: plain });
    }
  });

  return result;
};

// 尝试把整段内容识别为 JSON，格式化为代码块展示
const renderJson = (summary: string) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(summary.trim());
  } catch {
    parsed = null;
  }

  if (parsed === null || typeof parsed !== 'object') {
    return null;
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.7,
        overflow: 'auto',
        maxHeight: 360,
      }}
    >
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
};

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '2px 0',
};

const labelStyle: React.CSSProperties = {
  flexShrink: 0,
  color: '#8c8c8c',
  minWidth: 96,
};

/** 标签：值 行 */
const renderFieldRow = (field: SummaryField, key?: string) => {
  const isSubField = field.label === '原值' || field.label === '新值';
  return (
    <div key={key} style={{ ...fieldRowStyle, paddingLeft: isSubField ? 20 : 0 }}>
      {field.label ? (
        <span style={{ ...labelStyle, color: isSubField ? '#bfbfbf' : '#8c8c8c' }}>
          {field.label}
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {renderLinkedText(field.value)}
      </span>
    </div>
  );
};

const renderStructuredSummary = (data: StructuredSummary) => (
  <div>
    {data.title ? (
      <div style={{ fontWeight: 600, marginBottom: 6, overflowWrap: 'anywhere' }}>{data.title}</div>
    ) : null}
    {data.fields.map((field, index) => renderFieldRow(field, `field-${index}`))}
    {data.groups.map((group) => (
      <div
        key={group.label}
        style={{
          marginTop: 8,
          padding: '8px 12px',
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: 6,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{group.label}</div>
        {group.items.map((item, index) => (
          <div
            key={`${item.label}|${item.details.map((detail) => `${detail.label}:${detail.value}`).join('|')}`}
            style={
              item.label
                ? { marginTop: index === 0 ? 0 : 8, paddingLeft: 12, borderLeft: '3px solid #d9d9d9' }
                : { marginTop: index === 0 ? 0 : 4 }
            }
          >
            {item.label ? <div style={{ fontWeight: 500, marginBottom: 2 }}>{item.label}</div> : null}
            {item.details.map((detail, detailIndex) =>
              renderFieldRow(detail, `detail-${detailIndex}`),
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
);

const renderSummary = (summary: string) => {
  const json = renderJson(summary);
  if (json) return json;

  const parsed = parseSummary(summary);
  if (!parsed.title && !parsed.fields.length && !parsed.groups.length) {
    return (
      <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {renderLinkedText(summary)}
      </div>
    );
  }
  return renderStructuredSummary(parsed);
};

const SummaryCell = ({ summary }: { summary: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const maxHeight = 220;

  useEffect(() => {
    setExpanded(false);
    const content = contentRef.current;
    setCanExpand(Boolean(content && content.scrollHeight > maxHeight));
  }, [summary]);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div
          ref={contentRef}
          style={{
            maxHeight: expanded ? undefined : maxHeight,
            overflow: expanded ? undefined : 'hidden',
          }}
        >
          {renderSummary(summary)}
        </div>
        {!expanded && canExpand && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 48,
              background: 'linear-gradient(rgba(255, 255, 255, 0), #fff)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      {canExpand && (
        <Typography.Link
          onClick={() => setExpanded((value) => !value)}
          style={{ display: 'inline-block', marginTop: 4 }}
        >
          {expanded ? '收起' : '展开'}
        </Typography.Link>
      )}
    </div>
  );
};

const ACTION_ENUM = {
  create: { text: '新增' },
  update: { text: '修改' },
  delete: { text: '删除' },
  'sync-push': { text: '推送同步' },
};

/** 模块英文标识 → 中文展示 */
const MODULE_ENUM: Record<string, string> = {
  product: '产品',
  'product-relation': '产品-关联',
  'product-ota-relation': 'OTA-关联',
  'ota-config': 'OTA配置',
  'dongle-ota-config': 'Dongle OTA配置',
  'app-upgrade': '应用更新',
  'user-account': '用户账号',
  announcement: '公告',
  'app-resource': 'APP资源',
  'app-resource-dict': 'APP资源-功能描述',
  policy: '协议',
  'protocol-v2': '协议V2',
  'peq-config': '配置文件',
  'peq-config-tag': '配置标签',
  'system-config': '系统配置',
};

const moduleText = (module: string): string => MODULE_ENUM[module] || module;

const ACTION_COLOR: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  'sync-push': 'purple',
};

export default () => {
  const { data: modules } = useRequest(getOperationLogModules);

  return (
    <PageContainer title="操作日志">
      <ProTable<GetOperationLogRes, GetOperationLogReq>
        rowKey="uuid"
        pagination={{
          showSizeChanger: true,
          defaultPageSize: 20,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        request={(params) => {
          const { current, pageSize, adminUsername, module, action, summary, startTime, endTime } =
            params;
          return getOperationLogs({
            pageSize,
            pageIndex: current,
            adminUsername,
            module,
            action,
            summary,
            startTime,
            endTime,
          }).then((res) => ({
            success: true,
            data: res.list,
            total: res.total,
          }));
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '管理员',
            dataIndex: 'adminUsername',
            width: 160,
          },
          {
            align: 'center',
            title: '模块',
            dataIndex: 'module',
            width: 140,
            valueEnum: Object.fromEntries((modules || []).map((m) => [m, { text: moduleText(m) }])),
            render: (_, record) => moduleText(record.module),
          },
          {
            align: 'center',
            title: '动作',
            dataIndex: 'action',
            width: 100,
            valueEnum: ACTION_ENUM,
            render: (_, record) => (
              <Tag color={ACTION_COLOR[record.action] || 'default'}>
                {ACTION_ENUM[record.action as keyof typeof ACTION_ENUM]?.text || record.action}
              </Tag>
            ),
          },
          {
            title: '操作内容',
            dataIndex: 'summary',
            width: 560,
            onCell: () => ({ style: { verticalAlign: 'top' } }),
            render: (_, record) => <SummaryCell summary={record.summary} />,
          },
          {
            align: 'center',
            title: 'IP',
            dataIndex: 'ip',
            width: 200,
            search: false,
            render: (_, record) => {
              const ip = formatIp(record.ip);
              if (!ip) return '';
              const region = (record.region ?? '').split('|').filter(Boolean);
              const country = region[0] ?? '';
              const isAbroad = Boolean(country) && country !== '中国';
              const regionText = region.filter((r) => r && r !== '0').join(' ');
              return (
                <div style={{ lineHeight: 1.5 }}>
                  <div>{ip}</div>
                  {regionText && (
                    <div style={{ fontSize: 12, color: isAbroad ? '#ff7875' : '#8c8c8c' }}>
                      {regionText}
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            align: 'center',
            title: '时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            width: 165,
            search: false,
          },
          {
            title: '时间范围',
            dataIndex: 'createTimeRange',
            hideInTable: true,
            valueType: 'dateTimeRange' as const,
            search: {
              transform: (value: unknown) => {
                const arr = value as { valueOf: () => number }[] | undefined;
                return {
                  startTime: arr?.[0]?.valueOf(),
                  endTime: arr?.[1]?.valueOf(),
                };
              },
            },
          },
        ]}
      />
    </PageContainer>
  );
};
