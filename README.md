# moondrop-admin-v2

水月雨（MOONDROP）运营支撑系统 V2 —— 基于 **UmiJS Max 4 + antd 5 + React 18** 全新重构的运营管理后台。

V1（[moondrop-admin](../moondrop-admin)）基于 antd 4，受限于 v4 的主题能力（仅支持编译期换主色）与老技术栈；本工程在保持同类页面范式的前提下，落地 V1 难以实现的能力。

## 技术栈

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| @umijs/max | ^4.7.29 | UmiJS 最新版，内置 antd / model / initialState / request 插件 |
| antd | ^5.29.3 | v5 最终版，支持运行时主题（`theme.darkAlgorithm`、动态 `colorPrimary`） |
| @ant-design/pro-components | ^2.8.10 | ProTable / ProForm / PageContainer 等 |
| react / react-dom | ^18.3.1 | |
| ahooks | ^3.9.5 | |
| typescript | ^5.9 | strict 模式 |

> antd 6 已发布，但 pro-components 尚未支持 v6（peer 依赖 `antd ^4 || ^5`），故锁定 antd 5 最新；待 pro-components 适配后可平滑升级。

## V2 重点能力（相对 V1 的增量）

- **运行时主题切换**：主色任意换、一键暗色模式（antd 5 Theme Algorithm），V1 在 antd 4 下只能编译期改 less 变量
- （规划中）其余 V1 未覆盖的功能，按需求逐步补充

## 快速开始

```bash
npm install
npm run dev     # http://localhost:11001
npm run build
npm run preview
```

## 与后端联调

- 开发环境 `/api` 代理至 `http://127.0.0.1:5000`（见 `.umirc.ts`），对应 `moondrop-service`
- 响应体约定与 V1 一致：`{code, desc, data}`，分页 `{total, list}`
- 后台接口 `/api/v1/admin` 前缀 + `token` 请求头鉴权（Redis 会话）

## 目录结构

```
moondrop-admin-v2/
├── .umirc.ts              # Umi 配置（代理、布局、路由）
├── src/
│   ├── app.tsx            # 运行时配置（initialState / 请求拦截等入口）
│   ├── global.less
│   ├── pages/             # 约定式路由：pages/<dir>/index.tsx → /<dir>
│   ├── services/          # API 模块（规划）
│   └── utils/             # 工具（规划）
└── tsconfig.json          # strict + @/* 别名
```

## 约定（延续 V1）

- 约定式路由，页面目录名即路由路径
- 列表页范式：`PageContainer` + ProTable + ahooks `useRequest`，适配 `PageResult<T> = { total, list }`
- 代码风格：2 空格缩进、单引号、无分号、尾逗号；组件 PascalCase、函数/变量 camelCase
- 提交规范：conventional commits（`feat/fix/docs/...`）
