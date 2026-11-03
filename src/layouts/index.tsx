import ThemeSettings from '@/components/ThemeSettings';
import { postAdminLogout } from '@/services/modules/admin';
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
  TagOutlined,
  TeamOutlined,
  UsbOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, useIntl, useLocation, useModel, Outlet } from '@umijs/max';
import { Avatar, Drawer, Dropdown, Grid, Layout, Menu, message, Modal, Space } from 'antd';
import { useState } from 'react';
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
          { path: '/product', name: intl.formatMessage({ id: 'menu.product' }) },
          { path: '/headphone-model', name: intl.formatMessage({ id: 'menu.headphoneModel' }) },
          { path: '/app-resource', name: intl.formatMessage({ id: 'menu.appResource' }) },
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: mode === 'dark' ? '#141414' : '#001529',
        }}
      >
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
          {intl.formatMessage({ id: 'app.title' })}
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
          style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
        />
        <Space size={16} align="center" style={{ flexShrink: 0 }}>
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
            style={{
              position: 'fixed',
              top: 56,
              bottom: 0,
              left: 0,
              overflow: 'auto',
              paddingTop: 8,
            }}
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
          }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
