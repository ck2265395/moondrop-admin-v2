import { getAdminMine } from '@/services/modules/admin';

// 登录态：根据 token 判断，已登录则拉取当前管理员信息
export async function getInitialState(): Promise<{
  isLoggedIn: boolean;
  name: string;
  avatar?: string;
}> {
  const token = localStorage.getItem('token');
  if (!token) {
    return { isLoggedIn: false, name: '' };
  }
  try {
    const mine = await getAdminMine();
    return { isLoggedIn: true, name: mine.name || mine.username, avatar: mine.casdoorAvatar ?? undefined };
  } catch {
    // token 失效：request 拦截器已提示，这里兜底清理
    localStorage.removeItem('token');
    return { isLoggedIn: false, name: '' };
  }
}

// 全局包裹主题 Provider（暗色算法 + 动态主色），须在 Umi 外层注入
import { ThemeProvider } from '@/theme/ThemeProvider';

export function rootContainer(container: React.ReactNode) {
  return <ThemeProvider>{container}</ThemeProvider>;
}
