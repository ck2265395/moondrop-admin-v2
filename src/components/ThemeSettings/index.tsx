import { COLOR_PRESETS, useTheme } from '@/theme/ThemeProvider';
import {
  BgColorsOutlined,
  CheckOutlined,
  DesktopOutlined,
  GlobalOutlined,
  MoonOutlined,
  MoreOutlined,
  SunOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Drawer, Dropdown, Grid, Slider, Switch, Tooltip } from 'antd';
import { useIntl } from '@umijs/max';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';

const LOCALE_KEY = 'umi_locale';

const LOCALE_OPTIONS = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

export default function ThemeSettings() {
  const intl = useIntl();
  const {
    mode,
    compact,
    colorPrimary,
    borderRadius,
    setMode,
    setCompact,
    setColorPrimary,
    setBorderRadius,
  } = useTheme();
  const [editorOpen, setEditorOpen] = useState(false);
  const [locale, setLocaleState] = useState<string>(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored) return stored;
    return navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US';
  });

  const handleLocaleClick: MenuProps['onClick'] = ({ key }) => {
    if (key === locale) return;
    localStorage.setItem(LOCALE_KEY, key);
    setLocaleState(key);
    // umi locale 插件在应用启动时读取 localStorage，这里刷新确保全部文案生效
    window.location.reload();
  };

  // 国际化切换后强制刷新文案
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const themeItems: MenuProps['items'] = [
    {
      key: 'auto',
      icon: <DesktopOutlined />,
      label: intl.formatMessage({ id: 'settings.mode.auto' }),
    },
    {
      key: 'light',
      icon: <SunOutlined />,
      label: intl.formatMessage({ id: 'settings.mode.light' }),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: intl.formatMessage({ id: 'settings.mode.dark' }),
    },
    { type: 'divider' },
    {
      key: 'compact',
      icon: <SwapOutlined />,
      label: intl.formatMessage({ id: 'settings.compact' }),
    },
    { type: 'divider' },
    {
      key: 'editor',
      icon: <BgColorsOutlined />,
      label: intl.formatMessage({ id: 'settings.themeEditor' }),
    },
  ];

  const handleThemeKey = (key: string) => {
    if (key === 'compact') {
      setCompact(!compact);
      return;
    }
    if (key === 'editor') {
      setEditorOpen(true);
      return;
    }
    if (key === 'auto' || key === 'light' || key === 'dark') {
      setMode(key);
    }
  };

  const handleThemeClick: MenuProps['onClick'] = ({ key }) => handleThemeKey(key);

  const renderCheck = (active: boolean) =>
    active ? <CheckOutlined style={{ color: colorPrimary }} /> : <span style={{ width: 14 }} />;

  // 移动端：主题/语言收进一个「⋯」下拉，桌面：两个图标平铺
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const mobileItems: MenuProps['items'] = [
    {
      key: 'theme',
      type: 'group',
      label: intl.formatMessage({ id: 'settings.theme' }),
      children: themeItems,
    },
    { type: 'divider' },
    {
      key: 'language',
      type: 'group',
      label: intl.formatMessage({ id: 'settings.language' }),
      children: LOCALE_OPTIONS.map((opt) => ({
        key: `locale-${opt.value}`,
        label: (
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            {opt.label}
            {renderCheck(opt.value === locale)}
          </span>
        ),
      })),
    },
  ];

  const handleMobileClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('locale-')) {
      const next = key.slice('locale-'.length);
      if (next !== locale) {
        localStorage.setItem(LOCALE_KEY, next);
        setLocaleState(next);
        window.location.reload();
      }
      return;
    }
    handleThemeKey(key);
  };

  const renderEditorDrawer = () => (
    <Drawer
      title={intl.formatMessage({ id: 'settings.themeEditor' })}
      placement="right"
      width={320}
      open={editorOpen}
      onClose={() => setEditorOpen(false)}
      footer={
        <Button
          block
          onClick={() => {
            setColorPrimary(COLOR_PRESETS[0]);
            setBorderRadius(6);
            setCompact(false);
            setMode('auto');
          }}
        >
          {intl.formatMessage({ id: 'settings.reset' })}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ marginBottom: 8 }}>{intl.formatMessage({ id: 'settings.color' })}</div>
          <ColorPicker
            value={colorPrimary}
            onChange={(color) => setColorPrimary(color.toHexString())}
            showText
            presets={[
              {
                label: intl.formatMessage({ id: 'settings.presets' }),
                colors: COLOR_PRESETS,
              },
            ]}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>
            {intl.formatMessage({ id: 'settings.borderRadius' })}
          </div>
          <Slider
            min={0}
            max={16}
            value={borderRadius}
            onChange={(value) => setBorderRadius(value)}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{intl.formatMessage({ id: 'settings.compact' })}</span>
          <Switch checked={compact} onChange={(checked) => setCompact(checked)} />
        </div>
      </div>
    </Drawer>
  );

  if (isMobile) {
    return (
      <>
        <Dropdown
          trigger={['click']}
          menu={{ items: mobileItems, onClick: handleMobileClick, selectable: false }}
        >
          <MoreOutlined
            style={{ color: '#fff', fontSize: 16, cursor: 'pointer', padding: '0 6px' }}
          />
        </Dropdown>
        {renderEditorDrawer()}
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Dropdown
          trigger={['click']}
          menu={{
            items: themeItems,
            onClick: handleThemeClick,
            selectable: true,
            selectedKeys: compact ? ['compact'] : [mode],
          }}
        >
          <Tooltip title={intl.formatMessage({ id: 'settings.theme' })}>
            <BgColorsOutlined
              style={{ color: '#fff', fontSize: 16, cursor: 'pointer', padding: '0 6px' }}
            />
          </Tooltip>
        </Dropdown>
        <Dropdown
          trigger={['click']}
          menu={{
            items: LOCALE_OPTIONS.map((opt) => ({
              key: opt.value,
              label: (
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  {opt.label}
                  {renderCheck(opt.value === locale)}
                </span>
              ),
            })),
            onClick: handleLocaleClick,
          }}
        >
          <Tooltip title={intl.formatMessage({ id: 'settings.language' })}>
            <GlobalOutlined
              style={{ color: '#fff', fontSize: 16, cursor: 'pointer', padding: '0 6px' }}
            />
          </Tooltip>
        </Dropdown>
      </div>
      {renderEditorDrawer()}
    </>
  );
}
