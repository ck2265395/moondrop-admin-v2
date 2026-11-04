import { defineConfig } from 'umi'

export default defineConfig({
  // 生产部署在同域子路径 /new/ 下（旧版在根路径）
  base: '/new/',
  publicPath: '/new/',
})
