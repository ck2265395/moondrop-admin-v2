import ThemeSettings from '@/components/ThemeSettings';
import { postAdminLogout } from '@/services/modules/admin';
import { useTheme } from '@/theme/ThemeProvider';
import { DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { history, useIntl, useLocation, useModel, Outlet } from '@umijs/max';
import { Button, message, Modal } from 'antd';

export default function BasicLayout() {
  const intl = useIntl();
  const location = useLocation();
  const { mode } = useTheme();
  const { initialState, setInitialState } = useModel('@@initialState');

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
    ],
  };

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

  return (
    <ProLayout
      title={intl.formatMessage({ id: 'app.title' })}
      logo={false}
      layout="mix"
      fixSiderbar
      fixedHeader
      route={route}
      location={{ pathname: location.pathname }}
      navTheme={mode === 'dark' ? 'realDark' : 'light'}
      avatarProps={{
        src: initialState.avatar,
        title: initialState.name,
        size: 'small',
        render: (_props, dom) => (
          <div onClick={(e) => { e.stopPropagation(); handleLogout(); }}>{dom}</div>
        ),
      }}
      actionsRender={() => [
        <ThemeSettings key="theme-settings" />,
        <Button
          key="logout"
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        />,
      ]}
    >
      <Outlet />
    </ProLayout>
  );
}
