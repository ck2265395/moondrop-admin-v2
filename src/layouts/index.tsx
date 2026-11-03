import ThemeSettings from '@/components/ThemeSettings';
import { useTheme } from '@/theme/ThemeProvider';
import { HomeOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { useIntl, useLocation, Outlet } from '@umijs/max';

export default function BasicLayout() {
  const intl = useIntl();
  const location = useLocation();
  const { mode } = useTheme();

  const route = {
    path: '/',
    routes: [
      {
        path: '/home',
        name: intl.formatMessage({ id: 'menu.home' }),
        icon: <HomeOutlined />,
      },
    ],
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
      actionsRender={() => [<ThemeSettings key="theme-settings" />]}
    >
      <Outlet />
    </ProLayout>
  );
}
