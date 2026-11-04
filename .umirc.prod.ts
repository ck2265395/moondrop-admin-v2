import { defineConfig } from 'umi'
import type WebpackChain from 'webpack-5-chain'

export default defineConfig({
  chainWebpack(config: WebpackChain) {
    config.merge({
      optimization: {
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 30000,
          minChunks: 3,
          automaticNameDelimiter: '.',
          cacheGroups: {
            vendor: {
              name: 'vendors',
              test({ resource }: { resource: string }) {
                return /[\\/]node_modules[\\/]/.test(resource)
              },
              priority: 10,
            },
          },
        },
      },
    })
  },
  hash: true,
  // 生产部署在同域子路径 /new/ 下（旧版在根路径）
  base: '/new/',
  publicPath: '/new/',
  define: {
    'ENV.title': 'MOONDROP',
    'ENV.env': 'prod',
    'ENV.casdoorEndpoint': 'https://auth.mdrop.co',
    'ENV.casdoorClientId': 'd374c2c5c4e4e419a0ed',
    // 线上同域，v1 在根路径
    'ENV.v1BaseUrl': '/',
  },
})
