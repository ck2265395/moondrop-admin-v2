import { defineConfig } from 'umi'

// build:test 的加载顺序为 .umirc.ts → .umirc.prod.ts → 本文件（UMI_ENV=test 时也会加载 .umirc.prod.ts 合并）
// 本文件优先级最高，用于将 UMI_ENV=test 构建的 define 覆盖回 test 值（避免被 .umirc.prod.ts 的 prod base/prod 值影响）
export default defineConfig({
  base: '/new/',
  publicPath: '/new/',
  define: {
    'ENV.title': 'MOONDROP Test',
    'ENV.env': 'test',
    'ENV.v1BaseUrl': '/',
  },
})
