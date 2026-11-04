import ThemeSettings from '@/components/ThemeSettings';
import { getPublicConfig } from '@/services/modules/system-config';
import { postAdminLogout } from '@/services/modules/admin';
import { completeImgUrl } from '@/utils/utils';
import { useTheme } from '@/theme/ThemeProvider';
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  AudioOutlined,
  BlockOutlined,
  CloudOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  ControlOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileMarkdownOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SlidersOutlined,
  SmileOutlined,
  SoundOutlined,
  StarOutlined,
  SwapOutlined,
  TagOutlined,
  TeamOutlined,
  UsbOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, useIntl, useLocation, useModel, Outlet } from '@umijs/max';
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Grid, Layout, Menu, message, Modal, Space, Tooltip } from 'antd';
import { useRequest } from 'ahooks';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface MenuDataItem {
  path: string;
  name?: string;
  icon?: ReactNode;
  routes?: MenuDataItem[];
}

const hasMenuPath = (item: MenuDataItem, pathname: string): boolean =>
  item.path === pathname || (item.routes ?? []).some((child) => hasMenuPath(child, pathname));

// 域节点不对应页面，取其下第一个叶子页面作为落地路径
const findFirstLeaf = (item: MenuDataItem): string =>
  item.routes?.length ? findFirstLeaf(item.routes[0]) : item.path;

// 二级/三级菜单图标（收窄为图标栏时展示，对齐旧版 menuIconMap）
const menuIconMap: Record<string, ReactNode> = {
  '/app-upgrade': <CloudSyncOutlined />,
  '/ota-config': <CloudOutlined />,
  '/dongle-ota-config': <UsbOutlined />,
  '/product': <AppstoreOutlined />,
  '/app-resource': <AppstoreAddOutlined />,
  '/headphone-model': <CustomerServiceOutlined />,
  '/protocol': <FileProtectOutlined />,
  '/image': <PictureOutlined />,
  '/announcement': <NotificationOutlined />,
  '/policy': <FileProtectOutlined />,
  '/protocol-v2': <FileProtectOutlined />,
  '/global-config': <SettingOutlined />,
  '/promote-position': <PictureOutlined />,
  '/promote': <PictureOutlined />,
  '/wallpaper': <BlockOutlined />,
  '/icon': <StarOutlined />,
  '/profilepics': <SmileOutlined />,
  '/asset-storage': <DatabaseOutlined />,
  '/qa-category': <QuestionCircleOutlined />,
  '/peq-config': <FileMarkdownOutlined />,
  '/peq-config-tags': <TagOutlined />,
  '/peq-config-comment': <CommentOutlined />,
  '/microphone-adjust': <AudioOutlined />,
  '/ref-response': <SlidersOutlined />,
  '/freq-response': <LineChartOutlined />,
  '/response-lib': <DatabaseOutlined />,
  '/white-noise-audio': <SoundOutlined />,
  '/huihifi': <SoundOutlined />,
  '/admin': <UserOutlined />,
  '/user-account': <TeamOutlined />,
  '/userFeedback': <CommentOutlined />,
  '/system-info': <DashboardOutlined />,
  '/system-config': <ControlOutlined />,
  '/operation-log': <FileSearchOutlined />,
};

export default function BasicLayout() {
  const intl = useIntl();
  const location = useLocation();
  const { resolvedMode: mode } = useTheme();
  const { data: publicConfig } = useRequest(getPublicConfig, {
    onError: () => {},
  });

  // 动态 tab 标题 + favicon（site 配置生效）
  useEffect(() => {
    const siteTitle = publicConfig?.['site.title'] || 'MOONDROP 运营支撑系统';
    document.title = siteTitle;

    const favicon = publicConfig?.['site.favicon'];
    if (favicon) {
      const url = completeImgUrl(favicon);
      const isIco = /\.ico(\?|$)/i.test(url);
      // 优先更新已存在的 link（兼容 index.html 硬编码的 favicon.ico）
      const selectors = isIco
        ? ['link[rel="shortcut icon"]', 'link[rel="icon"]']
        : ['link[rel="icon"]', 'link[rel="shortcut icon"]'];
      let link: HTMLLinkElement | null = null;
      for (const sel of selectors) {
        link = document.querySelector(sel);
        if (link) break;
      }
      if (!link) {
        link = document.createElement('link');
        link.rel = isIco ? 'shortcut icon' : 'icon';
        document.head.appendChild(link);
      }
      link.rel = isIco ? 'shortcut icon' : 'icon';
      link.type = isIco ? 'image/x-icon' : link.type || '';
      link.href = url;
    }
  }, [publicConfig]);

  const { initialState, setInitialState } = useModel('@@initialState');

  // 响应式：md 以下侧边栏收进顶栏汉堡按钮，以抽屉弹出
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 路由守卫：未登录跳转登录页（/login 本身不走此布局）
  if (!initialState?.isLoggedIn) {
    history.push('/login');
    return null;
  }

  const route = {
    path: '/',
    routes: [
      {
        path: '/dashboard',
        name: intl.formatMessage({ id: 'menu.dashboard' }),
        icon: <DashboardOutlined />,
      },
      {
        path: '/product-manage',
        name: intl.formatMessage({ id: 'menu.productManage' }),
        icon: <AppstoreOutlined />,
        routes: [
          { path: '/app-resource', name: intl.formatMessage({ id: 'menu.appResource' }) },
          { path: '/product', name: intl.formatMessage({ id: 'menu.product' }) },
          { path: '/headphone-model', name: intl.formatMessage({ id: 'menu.headphoneModel' }) },
        ],
      },
      {
        path: '/firmware',
        name: intl.formatMessage({ id: 'menu.firmware' }),
        icon: <CloudUploadOutlined />,
        routes: [
          { path: '/app-upgrade', name: intl.formatMessage({ id: 'menu.appUpgrade' }) },
          { path: '/ota-config', name: intl.formatMessage({ id: 'menu.otaConfig' }) },
          { path: '/dongle-ota-config', name: intl.formatMessage({ id: 'menu.dongleOtaConfig' }) },
        ],
      },
      {
        path: '/audio-config',
        name: intl.formatMessage({ id: 'menu.audioConfig' }),
        icon: <SlidersOutlined />,
        routes: [
          { path: '/peq-config', name: intl.formatMessage({ id: 'menu.peqConfig' }) },
          { path: '/peq-config-tags', name: intl.formatMessage({ id: 'menu.peqConfigTags' }) },
          { path: '/peq-config-comment', name: intl.formatMessage({ id: 'menu.peqConfigComment' }) },
          { path: '/microphone-adjust', name: intl.formatMessage({ id: 'menu.microphoneAdjust' }) },
          { path: '/ref-response', name: intl.formatMessage({ id: 'menu.refResponse' }) },
          { path: '/freq-response', name: intl.formatMessage({ id: 'menu.freqResponse' }) },
          { path: '/response-lib', name: intl.formatMessage({ id: 'menu.responseLib' }) },
          { path: '/white-noise-audio', name: intl.formatMessage({ id: 'menu.whiteNoiseAudio' }) },
          { path: '/huihifi', name: intl.formatMessage({ id: 'menu.huihifi' }) },
        ],
      },
      {
        path: '/content',
        name: intl.formatMessage({ id: 'menu.content' }),
        icon: <PictureOutlined />,
        routes: [
          {
            path: '/protocol',
            name: intl.formatMessage({ id: 'menu.protocol' }),
            routes: [
              { path: '/announcement', name: intl.formatMessage({ id: 'menu.announcement' }) },
              { path: '/policy', name: intl.formatMessage({ id: 'menu.policy' }) },
              { path: '/protocol-v2', name: intl.formatMessage({ id: 'menu.protocolV2' }) },
              { path: '/global-config', name: intl.formatMessage({ id: 'menu.globalConfig' }) },
            ],
          },
          {
            path: '/image',
            name: intl.formatMessage({ id: 'menu.image' }),
            routes: [
              { path: '/promote-position', name: intl.formatMessage({ id: 'menu.promotePosition' }) },
              { path: '/promote', name: intl.formatMessage({ id: 'menu.promote' }) },
              { path: '/wallpaper', name: intl.formatMessage({ id: 'menu.wallpaper' }) },
              { path: '/icon', name: intl.formatMessage({ id: 'menu.icon' }) },
              { path: '/profilepics', name: intl.formatMessage({ id: 'menu.profilepics' }) },
              { path: '/asset-storage', name: intl.formatMessage({ id: 'menu.assetStorage' }) },
            ],
          },
          { path: '/qa-category', name: intl.formatMessage({ id: 'menu.qaCategory' }) },
        ],
      },
      {
        path: '/user-manage',
        name: intl.formatMessage({ id: 'menu.userManage' }),
        icon: <TeamOutlined />,
        routes: [
          { path: '/user-account', name: intl.formatMessage({ id: 'menu.userAccount' }) },
          { path: '/userFeedback', name: intl.formatMessage({ id: 'menu.userFeedback' }) },
        ],
      },
      {
        path: '/system-manage',
        name: intl.formatMessage({ id: 'menu.systemManage' }),
        icon: <SettingOutlined />,
        routes: [
          { path: '/admin', name: intl.formatMessage({ id: 'menu.admin' }) },
          { path: '/system-info', name: intl.formatMessage({ id: 'menu.systemInfo' }) },
          { path: '/system-config', name: intl.formatMessage({ id: 'menu.systemConfig' }) },
          { path: '/operation-log', name: intl.formatMessage({ id: 'menu.operationLog' }) },
        ],
      },
    ],
  };

  // 根据当前 pathname 在菜单树里找完整祖先路径（不含根节点）
  const findBreadcrumbPath = (
    items: MenuDataItem[],
    pathname: string,
    trail: MenuDataItem[] = [],
  ): MenuDataItem[] | null => {
    for (const item of items) {
      const nextTrail = [...trail, item];
      if (item.path === pathname) return nextTrail;
      if (item.routes?.length) {
        const found = findBreadcrumbPath(item.routes, pathname, nextTrail);
        if (found) return found;
      }
    }
    return null;
  };

  const breadcrumbItems = findBreadcrumbPath(route.routes, location.pathname);

  // 当前所在的一级域（按菜单树祖先关系匹配，不依赖路径前缀）
  const activeTopItem = (route.routes as MenuDataItem[] | undefined)?.find((item) =>
    hasMenuPath(item, location.pathname),
  );

  const siderRoutes = activeTopItem?.routes ?? [];
  const hasSider = siderRoutes.length > 0;
  const siderWidth = siderCollapsed ? 64 : 180;

  const handleLogout = () => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'logout.confirm' }),
      onOk: async () => {
        try {
          await postAdminLogout();
        } catch {
          // 忽略登出接口异常，本地清理后照常退出
        }
        localStorage.removeItem('token');
        setInitialState({ isLoggedIn: false, name: '' });
        message.success(intl.formatMessage({ id: 'logout.success' }));
        history.push('/login');
      },
    });
  };

  const siderMenuItems = siderRoutes.map((item) => ({
    key: item.path,
    icon: menuIconMap[item.path],
    label: item.name,
    children: item.routes?.map((child) => ({
      key: child.path,
      icon: menuIconMap[child.path],
      label: child.name,
    })),
  }));

  const headerBgUrl = publicConfig?.['skin.header_bg_image'];
  const siderBgUrl = publicConfig?.['skin.sider_bg_image'];
  // 从当前主题预设派生 Header 背景色，换预设时自动跟着变
  const { headerBgColor } = useTheme();
  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    // 有图：半透明黑遮罩 + 背景图；无图：用预设的 headerBgColor 兜底
    backgroundImage: headerBgUrl
      ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${completeImgUrl(headerBgUrl)})`
      : undefined,
    backgroundSize: headerBgUrl ? 'cover' : undefined,
    backgroundPosition: headerBgUrl ? 'center' : undefined,
    backgroundRepeat: headerBgUrl ? 'no-repeat' : undefined,
    backgroundColor: headerBgUrl ? undefined : headerBgColor,
  };
  const siderBaseBg = mode === 'dark' ? '#141414' : '#ffffff';
  const siderStyle: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    bottom: 0,
    left: 0,
    overflow: 'auto',
    paddingTop: 8,
    // 有图：半透明黑遮罩 + 背景图；无图：默认白底/深色底
    backgroundImage: siderBgUrl
      ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${completeImgUrl(siderBgUrl)})`
      : undefined,
    backgroundSize: siderBgUrl ? 'cover' : undefined,
    backgroundPosition: siderBgUrl ? 'center' : undefined,
    backgroundRepeat: siderBgUrl ? 'no-repeat' : undefined,
    backgroundColor: siderBgUrl ? undefined : siderBaseBg,
    // 侧边栏与内容区的分隔线：浅色模式半透明灰，深色模式半透明白
    borderRight: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={headerStyle}>
        {hasSider && isMobile ? (
          <MenuUnfoldOutlined
            onClick={() => setMobileMenuOpen(true)}
            style={{ color: '#fff', fontSize: 18, marginRight: 12, cursor: 'pointer' }}
          />
        ) : null}
        <span
          style={{
            color: '#fff',
            fontWeight: 600,
            marginRight: screens.md ? 24 : 12,
            whiteSpace: 'nowrap',
          }}
        >
          {publicConfig?.['site.logo'] ? (
            <img
              src={completeImgUrl(publicConfig['site.logo'])}
              alt={publicConfig?.['site.title'] || 'MOONDROP'}
              style={{ height: 28, verticalAlign: 'middle' }}
            />
          ) : (
            publicConfig?.['site.title'] || intl.formatMessage({ id: 'app.title' })
          )}
        </span>
        <Menu
          mode="horizontal"
          theme="dark"
          selectedKeys={activeTopItem ? [activeTopItem.path] : []}
          items={(route.routes ?? []).map((item) => ({
            key: item.path,
            label: item.name,
            icon: item.icon,
          }))}
          onClick={({ key }) => {
            const target = (route.routes ?? []).find((item) => item.path === key);
            if (target) {
              history.push(findFirstLeaf(target));
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            borderBottom: 'none',
            // antd dark Menu 默认带 #001529 背景色，盖在 Header 背景图上。
            // 强制透明让 Header 的 linear-gradient + url() 透出来
            background: 'transparent !important',
          }}
        />
        <Space size={16} align="center" style={{ flexShrink: 0 }}>
          <Tooltip title="切换到旧版">
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                // 去掉 /new 前缀：/new/dashboard → /dashboard
                const legacyPath = location.pathname.replace(/^\/new/, '') || '/';
                window.location.href = legacyPath + location.search;
              }}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}
            >
              旧版
            </Button>
          </Tooltip>
          <ThemeSettings />
          <Dropdown
            trigger={['hover']}
            placement="bottom"
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: intl.formatMessage({ id: 'logout.label' }),
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Space size={8} align="center" style={{ cursor: 'pointer', paddingRight: 8 }}>
              <Avatar
                size={32}
                src={initialState?.avatar}
                icon={<UserOutlined />}
                style={{
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              />
              {screens.md ? (
                <span style={{ color: '#fff' }}>{initialState?.name}</span>
              ) : null}
            </Space>
          </Dropdown>
        </Space>
      </Layout.Header>
      <Layout>
        {hasSider && !isMobile ? (
          <Layout.Sider
            width={180}
            collapsedWidth={64}
            collapsed={siderCollapsed}
            collapsible
            trigger={null}
            breakpoint="lg"
            onBreakpoint={(broken) => setSiderCollapsed(broken)}
            theme={mode === 'dark' ? 'dark' : 'light'}
            style={siderStyle}
          >
            <Menu
              key={activeTopItem?.path}
              mode="inline"
              theme={mode === 'dark' ? 'dark' : 'light'}
              inlineCollapsed={siderCollapsed}
              selectedKeys={[location.pathname]}
              defaultOpenKeys={siderCollapsed ? [] : siderRoutes
                .filter((item) => item.routes?.length)
                .map((item) => item.path)}
              items={siderMenuItems}
              onClick={({ key }) => history.push(key)}
              style={{ borderInlineEnd: 'none' }}
            />
          </Layout.Sider>
        ) : null}
        {hasSider && isMobile ? (
          <Drawer
            placement="left"
            width={260}
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            styles={{ body: { padding: 0 } }}
            title={activeTopItem?.name}
          >
            <Menu
              key={`drawer-${activeTopItem?.path}`}
              mode="inline"
              theme={mode === 'dark' ? 'dark' : 'light'}
              selectedKeys={[location.pathname]}
              defaultOpenKeys={siderRoutes
                .filter((item) => item.routes?.length)
                .map((item) => item.path)}
              items={siderMenuItems}
              onClick={({ key }) => {
                history.push(key);
                setMobileMenuOpen(false);
              }}
              style={{ borderInlineEnd: 'none' }}
            />
          </Drawer>
        ) : null}
        <Layout.Content
          style={{
            marginTop: 56,
            marginLeft: hasSider && !isMobile ? siderWidth : 0,
            minHeight: 'calc(100vh - 56px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {breadcrumbItems && location.pathname !== '/' ? (
            <div
              style={{
                padding: '16px 48px 0',
                marginTop: 0,
                background: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
              }}
            >
              <Breadcrumb
                items={breadcrumbItems.map((item, idx) => ({
                  title: item.name,
                  onClick: () => {
                    if (idx < breadcrumbItems!.length - 1) {
                      history.push(findFirstLeaf(item));
                    }
                  },
                }))}
              />
            </div>
          ) : null}
          <div
            style={{
              marginTop: breadcrumbItems && location.pathname !== '/' ? 12 : 0,
              flex: 1,
            }}
          >
            <Outlet />
          </div>
          {/* Footer 版权区 */}
          {(() => {
            const company = publicConfig?.['footer.company'] || '';
            const copyrightTpl =
              publicConfig?.['footer.copyright'] || '© {year} {company}. All rights reserved.';
            const copyrightText = copyrightTpl
              .replace(/\{year\}/g, String(new Date().getFullYear()))
              .replace(/\{company\}/g, company);
            const icp = publicConfig?.['site.icp'] || '';
            const customerService = publicConfig?.['footer.customer_service'] || '';
            const lines = [copyrightText, icp, customerService].filter(Boolean);
            if (!lines.length) return null;
            return (
              <div
                style={{
                  flexShrink: 0,
                  textAlign: 'center',
                  padding: '12px 24px',
                  fontSize: 12,
                  color: mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
                  borderTop:
                    mode === 'dark'
                      ? '1px solid rgba(255,255,255,0.06)'
                      : '1px solid rgba(0,0,0,0.06)',
                  background:
                    mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                }}
              >
                {lines.join(' · ')}
              </div>
            );
          })()}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
