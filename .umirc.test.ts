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
  // test 环境也部署在同域子路径 /new/ 下，与 prod 一致
  base: '/new/',
  publicPath: '/new/',
  define: {
    'ENV.title': 'MOONDROP Test',
    'ENV.env': 'test',
    'ENV.casdoorEndpoint': 'https://auth.mdrop.co',
    'ENV.casdoorClientId': 'd374c2c5c4e4e419a0ed',
    'ENV.v1BaseUrl': '/',
  },
})
