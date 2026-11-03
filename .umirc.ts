import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'Moondrop Admin V2',
    locale: false,
  },
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: './home' },
  ],
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    },
  },
  npmClient: 'npm',
});
