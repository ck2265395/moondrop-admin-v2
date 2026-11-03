import { defineConfig } from 'umi';

export default defineConfig({
  antd: {},
  model: {},
  initialState: {},
  request: {},
  access: {},
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
    title: true,
  },
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'login.title', layout: false, component: './login' },
    { path: '/dashboard', name: 'menu.dashboard', component: './dashboard' },
  ],
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    },
  },
  npmClient: 'npm',
});
