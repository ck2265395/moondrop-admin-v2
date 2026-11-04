import type { GetSystemConfigIndexRes } from '@/services/modules/system-config';
import { getSystemConfigIndex, patchSystemConfig } from '@/services/modules/system-config';
import FileUpload from '@/components/FileUpload';
import { completeImgUrl } from '@/utils/utils';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Card, Col, Image, Input, InputNumber, message, Row, Space, Spin, Switch, Typography } from 'antd';
import { useMemo, useState } from 'react';

interface ConfigGroup {
  key: string;
  label: string;
  items: GetSystemConfigIndexRes[];
}

/** 单个配置项行（名称 + 控件） */
const ConfigItemRow = ({
  item,
  saving,
  onChange,
}: {
  item: GetSystemConfigIndexRes;
  saving?: boolean;
  onChange: (key: string, value: string) => void;
}) => (
  <div>
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
    >
      <Typography.Text strong ellipsis>
        {item.label}
      </Typography.Text>
      {item.type === 'boolean' && (
        <Switch
          checked={item.value === 'true'}
          loading={saving}
          onChange={(checked) => onChange(item.key, checked ? 'true' : 'false')}
        />
      )}
    </div>
    {item.description && (
      <Typography.Paragraph
        type="secondary"
        style={{ marginBottom: 4, fontSize: 12 }}
        ellipsis={{ rows: 2, expandable: true }}
      >
        {item.description}
      </Typography.Paragraph>
    )}
    {item.type === 'boolean' ? (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        状态：
        <Typography.Text type={item.value === 'true' ? 'success' : 'secondary'}>
          {item.value === 'true' ? '已开启' : '已关闭'}
        </Typography.Text>
      </Typography.Text>
    ) : item.type === 'number' ? (
      <InputNumber
        size="small"
        defaultValue={Number(item.value)}
        disabled={saving}
        style={{ width: '100%' }}
        onBlur={(e) => {
          const value = e.target.value.trim();
          if (value !== '' && value !== item.value) onChange(item.key, value);
        }}
      />
    ) : item.type === 'image' ? (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {item.value && (
          <Image
            src={completeImgUrl(item.value)}
            width={120}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
            preview
          />
        )}
        <FileUpload
          value={item.value ? [item.value] : []}
          max={1}
          fileGroup="skin-img"
          ext={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.ico', '.svg']}
          onChange={(urls) => onChange(item.key, urls?.[0] ?? '')}
        />
        {item.value && (
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, cursor: 'pointer' }}
            onClick={() => onChange(item.key, '')}
          >
            清除图片
          </Typography.Text>
        )}
      </Space>
    ) : (
      <Input
        size="small"
        defaultValue={item.value}
        disabled={saving}
        onBlur={(e) => {
          const value = e.target.value.trim();
          if (value !== item.value) onChange(item.key, value);
        }}
      />
    )}
  </div>
);

export default () => {
  const { data, loading, refresh } = useRequest(getSystemConfigIndex);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const handleSave = (key: string, value: string) => {
    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    patchSystemConfig(key, value)
      .then(() => {
        message.success('已保存');
        refresh();
      })
      .finally(() => {
        setSavingKeys((prev) => ({ ...prev, [key]: false }));
      });
  };

  const groups = useMemo(() => {
    const map = new Map<string, ConfigGroup>();
    (data ?? []).forEach((item) => {
      const group = map.get(item.groupKey);
      if (group) {
        group.items.push(item);
        return;
      }
      map.set(item.groupKey, {
        key: item.groupKey,
        label: item.groupLabel || item.groupKey,
        items: [item],
      });
    });
    return [...map.values()];
  }, [data]);

  return (
    <PageContainer>
      <Spin spinning={loading}>
        {groups.length ? (
          <Row gutter={[16, 16]}>
            {groups.map((group) => (
              <Col key={group.key} xs={24} sm={24} md={12} lg={8} xl={6}>
                <Card
                  size="small"
                  title={group.label}
                  styles={{ body: { paddingTop: 12 } }}
                  style={{ height: '100%' }}
                >
                  <Row gutter={[12, 12]}>
                    {group.items.map((item) => (
                      <Col key={item.key} span={24}>
                        <ConfigItemRow
                          item={item}
                          saving={savingKeys[item.key]}
                          onChange={handleSave}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          !loading && <Typography.Text type="secondary">暂无配置项</Typography.Text>
        )}
      </Spin>
    </PageContainer>
  );
};
