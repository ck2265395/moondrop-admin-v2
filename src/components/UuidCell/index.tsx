import { CopyOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, message, Space, Tooltip } from 'antd';
import { useState } from 'react';

/** UUID 单元格：默认截断显示，点击眼睛切换完整显示，点击复制按钮复制完整 UUID */
const UuidCell = ({ uuid }: { uuid: string }) => {
  const [visible, setVisible] = useState(false);
  const display = visible ? uuid : `${uuid.slice(0, 8)}...`;

  return (
    <Space size={4}>
      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{display}</span>
      <Tooltip title={visible ? '隐藏' : '显示'}>
        <Button
          type="link"
          size="small"
          icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setVisible((current) => !current)}
          style={{ padding: 0, height: 'auto' }}
        />
      </Tooltip>
      <Tooltip title="复制 UUID">
        <Button
          type="link"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard
              .writeText(uuid)
              .then(() => message.success('已复制'))
              .catch(() => message.error('复制失败'));
          }}
          style={{ padding: 0, height: 'auto' }}
        />
      </Tooltip>
    </Space>
  );
};

export default UuidCell;
