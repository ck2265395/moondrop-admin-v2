import type { GetOperationLogReq, GetOperationLogRes } from '@/services/modules/operation-log';
import { getOperationLogAdmins, getOperationLogModules, getOperationLogs } from '@/services/modules/operation-log';
import { getIconAll } from '@/services/modules/icon';
import { renderFileIcon } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const IMAGE_URL_PATTERN =
  /((?:https?:\/\/|\/\/)[^\s]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?|(?:[\w-]+\/)+[\w.-]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?)/gi;

/** 完整 http(s) URL */
const HTTP_URL_PATTERN = /(https?:\/\/[^\s)]+)/gi;

/** CDN 上的文档/媒体路径（带扩展名），可带或不带前导斜杠 */
const CDN_PATH_PATTERN =
  /((?:\/)?(?:[\w-]+\/)*[\w.-]+\.(?:html?|pdf|json|txt|xml|md|doc(?:x)?|xls(?:x)?|ppt(?:x)?|csv|mp3|wav|flac|m4a|aac|ogg))/gi;

/** 把路径补成完整可点击 URL，已是 http(s) 则原样返回 */
const toClickableUrl = (src: string): string => {
  if (/^https?:\/\//.test(src)) return src;
  // 统一去掉开头的 /，让 completeImgUrl 正确拼接
  const trimmed = src.replace(/^\/+/, '');
  return completeImgUrl(trimmed);
};

type IconFileMap = Map<string, string>;

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** 历史日志的图标字段记录的是图标 UUID，这里按图标表映射回文件路径以便走通用图片渲染 */
const resolveIconUuids = (text: string, iconFileMap?: IconFileMap): string => {
  if (!iconFileMap?.size || !text) return text;
  return text.replace(UUID_PATTERN, (uuid) => iconFileMap.get(uuid.toLowerCase()) ?? uuid);
};

const renderLinkedText = (text: string, iconFileMap?: IconFileMap) => {
  const content: React.ReactNode[] = [];
  let key = 0;

  const segments: { type: 'text' | 'image' | 'url' | 'cdn'; value: string }[] = [];

  // 1. 图片
  let remaining = resolveIconUuids(text, iconFileMap);
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
    // http URL 渲染成文字链接，CDN 文档路径渲染成 文件图标 + 链接（hover 显示完整 URL）
    const url = toClickableUrl(seg.value);
    if (seg.type === 'cdn') {
      content.push(
        <a
          key={`file-${key++}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            margin: '0 4px',
            verticalAlign: 'middle',
          }}
          title={url}
        >
          {renderFileIcon(seg.value, 18)}
          <span style={{ color: '#1890ff', wordBreak: 'break-all' }}>{seg.value}</span>
        </a>,
      );
      continue;
    }
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

/** 「旧值 → 新值」对比分隔符（与后端操作日志 update 约定一致） */
const DIFF_ARROW = ' → ';

/** 只对这些字段标签的「旧值 → 新值」做 diff 标红，其余标签保持原渲染 */
const DIFF_LABELS = new Set(['功能配置', '权限', '标签', '名称', '版本号']);

/** 空值占位（后端 formatLogValue 约定）或空字符串，任一侧为空则不做 diff */
const isDiffEmpty = (text: string) => !text || text === '空' || text === '无' || text === '(空)';

/** 值里包含链接/图片/文档路径时不做 diff，保持原链接渲染 */
const LINK_LIKE_PATTERN = new RegExp(
  `(?:${IMAGE_URL_PATTERN.source}|${HTTP_URL_PATTERN.source}|${CDN_PATH_PATTERN.source})`,
  'i',
);

interface DiffPart {
  text: string;
  changed: boolean;
}

/** LCS diff：返回两侧按序标记的片段，changed=true 表示仅存在于本侧 */
const lcsDiffParts = (a: string[], b: string[]): [DiffPart[], DiffPart[]] => {
  const n = a.length;
  const m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const partsA: DiffPart[] = [];
  const partsB: DiffPart[] = [];
  const push = (parts: DiffPart[], text: string, changed: boolean) => {
    const last = parts[parts.length - 1];
    if (last && last.changed === changed) {
      last.text += text;
    } else {
      parts.push({ text, changed });
    }
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(partsA, a[i], false);
      push(partsB, b[j], false);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(partsA, a[i], true);
      i += 1;
    } else {
      push(partsB, b[j], true);
      j += 1;
    }
  }
  while (i < n) {
    push(partsA, a[i], true);
    i += 1;
  }
  while (j < m) {
    push(partsB, b[j], true);
    j += 1;
  }
  return [partsA, partsB];
};

const DIFF_CHANGED_OLD_STYLE: React.CSSProperties = {
  color: '#bfbfbf',
  textDecoration: 'line-through',
  textDecorationColor: '#ff7875',
};

const DIFF_CHANGED_NEW_STYLE: React.CSSProperties = {
  color: '#389e0d',
  fontWeight: 600,
};

const renderDiffParts = (parts: DiffPart[], changedStyle: React.CSSProperties) =>
  parts.map((part, index) =>
    part.changed ? (
      <span key={index} style={changedStyle}>
        {part.text}
      </span>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );

/** 「旧值 → 新值」对比渲染：差异部分标红（旧值加删除线），其余值原样渲染 */
const renderDiffValue = (value: string, label?: string, iconFileMap?: IconFileMap) => {
  const resolvedText = resolveIconUuids(value, iconFileMap);
  if (label && !DIFF_LABELS.has(label)) {
    return renderLinkedText(resolvedText, iconFileMap);
  }
  const arrowIndex = resolvedText.indexOf(DIFF_ARROW);
  if (arrowIndex <= 0 || arrowIndex + DIFF_ARROW.length >= resolvedText.length) {
    return renderLinkedText(resolvedText, iconFileMap);
  }
  const oldText = resolvedText.slice(0, arrowIndex);
  const newText = resolvedText.slice(arrowIndex + DIFF_ARROW.length);
  // 任一侧为空不比较；链接/图片保持可点击渲染；超长文本跳过 diff 避免 O(n²) 开销
  if (
    isDiffEmpty(oldText) ||
    isDiffEmpty(newText) ||
    LINK_LIKE_PATTERN.test(oldText) ||
    LINK_LIKE_PATTERN.test(newText) ||
    oldText.length > 600 ||
    newText.length > 600
  ) {
    return renderLinkedText(resolvedText, iconFileMap);
  }

  // 列表类值（逗号/顿号分隔）按集合对比：项在另一侧不存在即标记增删，与顺序无关
  const separatorPattern = /[,，、]/;
  if (separatorPattern.test(oldText) || separatorPattern.test(newText)) {
    const splitItems = (text: string) =>
      text.split(/[,，、]/).map((item) => item.trim()).filter(Boolean);
    const oldItems = splitItems(oldText);
    const newItems = splitItems(newText);
    const newSet = new Set(newItems);
    const oldSet = new Set(oldItems);
    const renderListSide = (items: string[], other: Set<string>, changedStyle: React.CSSProperties) =>
      items.map((item, index) => (
        <span key={index}>
          {index > 0 ? <span style={{ color: '#8c8c8c' }}>,</span> : null}
          {other.has(item) ? (
            <span>{item}</span>
          ) : (
            <span style={changedStyle}>{item}</span>
          )}
        </span>
      ));
    return (
      <span>
        {renderListSide(oldItems, newSet, DIFF_CHANGED_OLD_STYLE)}
        <span style={{ color: '#8c8c8c', margin: '0 4px' }}>→</span>
        {renderListSide(newItems, oldSet, DIFF_CHANGED_NEW_STYLE)}
      </span>
    );
  }

  // 普通单值逐字符对比
  const [partsOld, partsNew] = lcsDiffParts(Array.from(oldText), Array.from(newText));
  return (
    <span>
      {renderDiffParts(partsOld, DIFF_CHANGED_OLD_STYLE)}
      <span style={{ color: '#8c8c8c', margin: '0 4px' }}>→</span>
      {renderDiffParts(partsNew, DIFF_CHANGED_NEW_STYLE)}
    </span>
  );
};

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
const renderFieldRow = (field: SummaryField, key?: string, iconFileMap?: IconFileMap) => {
  const isSubField = field.label === '原值' || field.label === '新值';
  return (
    <div key={key} style={{ ...fieldRowStyle, paddingLeft: isSubField ? 20 : 0 }}>
      {field.label ? (
        <span style={{ ...labelStyle, color: isSubField ? '#bfbfbf' : '#8c8c8c' }}>
          {field.label}
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {renderDiffValue(field.value, field.label, iconFileMap)}
      </span>
    </div>
  );
};

const renderStructuredSummary = (data: StructuredSummary, iconFileMap?: IconFileMap) => (
  <div>
    {data.title ? (
      <div style={{ fontWeight: 600, marginBottom: 6, overflowWrap: 'anywhere' }}>{data.title}</div>
    ) : null}
    {data.fields.map((field, index) => renderFieldRow(field, `field-${index}`, iconFileMap))}
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
              renderFieldRow(detail, `detail-${detailIndex}`, iconFileMap),
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
);

const renderSummary = (summary: string, iconFileMap?: IconFileMap) => {
  const json = renderJson(summary);
  if (json) return json;

  const parsed = parseSummary(summary);
  if (!parsed.title && !parsed.fields.length && !parsed.groups.length) {
    return (
      <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {renderLinkedText(summary, iconFileMap)}
      </div>
    );
  }
  return renderStructuredSummary(parsed, iconFileMap);
};

const SummaryCell = ({ summary, iconFileMap }: { summary: string; iconFileMap?: IconFileMap }) => {
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
          {renderSummary(summary, iconFileMap)}
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
  audit: { text: '审核' },
  'sync-push': { text: '推送同步' },
};

/** 模块英文标识 → 中文展示 */
const MODULE_ENUM: Record<string, string> = {
  admin: '管理员',
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
  'microphone-adjust': '麦克风校准',
  'ref-response': '原始频响',
  'freq-response': '频响曲线',
  'response-lib': '频响库',
  'response-lib-tags': '频响库标签',
  'white-noise-audio': '白噪音音频',
  'system-config': '系统配置',
  'virtual-sound-card-channel': '虚拟声卡通道',
  'virtual-sound-card-eq-config': '虚拟声卡静态EQ配置',
  'virtual-sound-card-drc-preset': '虚拟声卡动态DRC预设',
};

const moduleText = (module: string): string => MODULE_ENUM[module] || module;

const ACTION_COLOR: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  audit: 'gold',
  'sync-push': 'purple',
};

export default () => {
  const { data: modules } = useRequest(getOperationLogModules);
  const { data: admins } = useRequest(getOperationLogAdmins);
  // 图标 UUID → 文件路径，用于历史日志里只记录了 uuid 的图标字段
  const { data: icons } = useRequest(getIconAll);
  const iconFileMap = useMemo(
    () => new Map((icons ?? []).map((item) => [item.uuid.toLowerCase(), item.file])),
    [icons],
  );

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
          const { current, pageSize, adminUuid, module, action, summary, startTime, endTime } =
            params;
          return getOperationLogs({
            pageSize,
            pageIndex: current,
            adminUuid,
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
            dataIndex: 'adminUuid',
            width: 200,
            valueType: 'select',
            fieldProps: { showSearch: true },
            valueEnum: Object.fromEntries((admins || []).map((a) => [a.uuid, { text: a.name }])),
            render: (_, record) =>
              record.adminName && record.adminName !== record.adminUsername
                ? `${record.adminUsername}(${record.adminName})`
                : record.adminUsername,
            order: 70,
          },
          {
            align: 'center',
            title: '模块',
            dataIndex: 'module',
            width: 140,
            valueEnum: Object.fromEntries((modules || []).map((m) => [m, { text: moduleText(m) }])),
            render: (_, record) => moduleText(record.module),
            order: 90,
          },
          {
            align: 'center',
            title: '动作',
            dataIndex: 'action',
            width: 100,
            valueEnum: ACTION_ENUM,
            order: 80,
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
            order: 100,
            onCell: () => ({ style: { verticalAlign: 'top' } }),
            render: (_, record) => (
              <SummaryCell summary={record.summary} iconFileMap={iconFileMap} />
            ),
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
