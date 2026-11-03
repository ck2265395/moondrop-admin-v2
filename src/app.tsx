import { ThemeProvider } from '@/theme/ThemeProvider';

// 运行时配置：initialState 占位，后续接入登录态 / 权限
export async function getInitialState(): Promise<{ name: string }> {
  return { name: 'Moondrop Admin V2' };
}

// 全局包裹主题 Provider（暗色算法 + 动态主色），须在 Umi 外层注入
export function rootContainer(container: React.ReactNode) {
  return <ThemeProvider>{container}</ThemeProvider>;
}
