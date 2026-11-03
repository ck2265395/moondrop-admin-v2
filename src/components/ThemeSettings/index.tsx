import { COLOR_PRESETS, useTheme } from '@/theme/ThemeProvider';
import { GithubOutlined } from '@ant-design/icons';
import { Segmented, Tooltip } from 'antd';
import { useIntl } from '@umijs/max';

const COLOR_LABELS: Record<string, string> = {
  '#1677ff': 'Blue',
  '#722ed1': 'Purple',
  '#eb2f96': 'Magenta',
  '#fa541c': 'Orange',
  '#13c2c2': 'Cyan',
  '#52c41a': 'Green',
};

export default function ThemeSettings() {
  const intl = useIntl();
  const { mode, colorPrimary, setMode, setColorPrimary } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Segmented
        value={mode}
        onChange={(value) => setMode(value as 'light' | 'dark')}
        options={[
          { label: intl.formatMessage({ id: 'settings.mode.light' }), value: 'light' },
          { label: intl.formatMessage({ id: 'settings.mode.dark' }), value: 'dark' },
        ]}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {COLOR_PRESETS.map((color) => (
          <Tooltip key={color} title={COLOR_LABELS[color]}>
            <button
              type="button"
              onClick={() => setColorPrimary(color)}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: colorPrimary === color ? '2px solid currentColor' : 'none',
                background: color,
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={COLOR_LABELS[color]}
            />
          </Tooltip>
        ))}
      </div>
      <a
        href="https://github.com/ck2265395/moondrop-admin-v2"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'inherit' }}
      >
        <GithubOutlined />
      </a>
    </div>
  );
}
