import { defineConfig } from 'umi';

export default defineConfig({
  antd: {},
  model: {},
  initialState: {},
  request: {},
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
    title: true,
  },
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'menu.home', component: './home' },
  ],
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    },
  },
  npmClient: 'npm',
});
