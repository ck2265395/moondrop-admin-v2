import { ConfigProvider, theme as antdTheme } from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  compact: boolean;
  colorPrimary: string;
  borderRadius: number;
  themePresetId: string;
  /** 当前预设对应的 Header 背景色（供 Layout 使用，有背景图时会被覆盖） */
  headerBgColor: string;
  setMode: (mode: ThemeMode) => void;
  setCompact: (compact: boolean) => void;
  setColorPrimary: (color: string) => void;
  setBorderRadius: (radius: number) => void;
  applyPreset: (id: string) => void;
}

const STORAGE_KEY = 'moondrop-admin-v2:theme';
export const COLOR_PRESETS = [
  '#1677ff',
  '#722ed1',
  '#eb2f96',
  '#fa541c',
  '#13c2c2',
  '#52c41a',
];

const DEFAULT_BORDER_RADIUS = 6;

/**
 * 风格预设：每一组是一套主色 + 圆角 + 几个"改变整体氛围"的背景/边框 token。
 * 只定义浅色 token，antd darkAlgorithm 会自动反色适配暗色模式。
 * 用户切换预设后仍可单独调主色（ColorPicker）或圆角（Slider），
 * themeConfig.token 合并时 state 值覆盖预设值。
 */
export interface ThemePreset {
  id: string;
  nameKey: string;
  colorPrimary: string;
  borderRadius: number;
  /** Header 背景色（无背景图时使用），不同预设风格各异 */
  headerBgColor: string;
  colorBgLayout?: string;
  colorBorderSecondary?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic',
    nameKey: 'settings.preset.classic',
    colorPrimary: '#1677ff',
    borderRadius: 6,
    headerBgColor: '#001529',
  },
  {
    id: 'pristine',
    nameKey: 'settings.preset.pristine',
    colorPrimary: '#1f1f1f',
    borderRadius: 8,
    headerBgColor: '#111111',
    colorBgLayout: '#ffffff',
  },
  {
    id: 'smoke',
    nameKey: 'settings.preset.smoke',
    colorPrimary: '#4b5563',
    borderRadius: 4,
    headerBgColor: '#374151',
    colorBgLayout: '#f5f5f5',
  },
  {
    id: 'purpleMist',
    nameKey: 'settings.preset.purpleMist',
    colorPrimary: '#722ed1',
    borderRadius: 8,
    headerBgColor: '#2a1248',
    colorBgLayout: '#f9f0ff',
    colorBorderSecondary: '#efdbff',
  },
  {
    id: 'ember',
    nameKey: 'settings.preset.ember',
    colorPrimary: '#fa8c16',
    borderRadius: 6,
    headerBgColor: '#7a2f00',
    colorBgLayout: '#fff7e6',
  },
  {
    id: 'layuiClassic',
    nameKey: 'settings.preset.layuiClassic',
    colorPrimary: '#1abc9c',
    borderRadius: 2,
    headerBgColor: '#20222A',
  },
];

function findPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

interface StoredTheme {
  mode: ThemeMode;
  compact: boolean;
  colorPrimary: string;
  borderRadius: number;
  themePresetId: string;
}

const FALLBACK: StoredTheme = {
  mode: 'auto',
  compact: false,
  colorPrimary: THEME_PRESETS[0].colorPrimary,
  borderRadius: THEME_PRESETS[0].borderRadius,
  themePresetId: THEME_PRESETS[0].id,
};

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemMode(): ResolvedMode {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function readStored(): StoredTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw) as Partial<StoredTheme>;
    const preset = findPreset(
      typeof parsed.themePresetId === 'string' ? parsed.themePresetId : '',
    );
    return {
      mode: parsed.mode === 'dark' || parsed.mode === 'light' ? parsed.mode : 'auto',
      compact: parsed.compact === true,
      colorPrimary:
        typeof parsed.colorPrimary === 'string' ? parsed.colorPrimary : preset.colorPrimary,
      borderRadius:
        typeof parsed.borderRadius === 'number' ? parsed.borderRadius : preset.borderRadius,
      themePresetId: preset.id,
    };
  } catch {
    return FALLBACK;
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: FALLBACK.mode,
  resolvedMode: 'light',
  compact: FALLBACK.compact,
  colorPrimary: FALLBACK.colorPrimary,
  borderRadius: FALLBACK.borderRadius,
  themePresetId: FALLBACK.themePresetId,
  headerBgColor: THEME_PRESETS[0].headerBgColor,
  setMode: () => {},
  setCompact: () => {},
  setColorPrimary: () => {},
  setBorderRadius: () => {},
  applyPreset: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(readStored);
  // 跟随系统时的实际生效模式
  const [systemMode, setSystemMode] = useState<ResolvedMode>(getSystemMode);

  const setMode = useCallback((mode: ThemeMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setCompact = useCallback((compact: boolean) => {
    setState((prev) => ({ ...prev, compact }));
  }, []);

  const setColorPrimary = useCallback((colorPrimary: string) => {
    setState((prev) => ({ ...prev, colorPrimary }));
  }, []);

  const setBorderRadius = useCallback((borderRadius: number) => {
    setState((prev) => ({ ...prev, borderRadius }));
  }, []);

  const applyPreset = useCallback((id: string) => {
    const preset = findPreset(id);
    setState((prev) => ({
      ...prev,
      themePresetId: preset.id,
      colorPrimary: preset.colorPrimary,
      borderRadius: preset.borderRadius,
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 监听系统主题变化（mode 为 auto 时生效）
  useEffect(() => {
    const media = window.matchMedia(MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedMode: ResolvedMode = state.mode === 'auto' ? systemMode : state.mode;

  const themeConfig = useMemo(() => {
    const preset = findPreset(state.themePresetId);
    const token: Record<string, unknown> = {};
    // 预设风格 token 先铺底
    if (preset.colorBgLayout) token.colorBgLayout = preset.colorBgLayout;
    if (preset.colorBorderSecondary) token.colorBorderSecondary = preset.colorBorderSecondary;
    // state 里用户最后一次的值永远覆盖预设
    token.colorPrimary = state.colorPrimary;
    token.borderRadius = state.borderRadius;
    return {
      algorithm: [
        resolvedMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        ...(state.compact ? [antdTheme.compactAlgorithm] : []),
      ],
      token,
      components: { Menu: { itemBorderRadius: 0 } },
    };
  }, [resolvedMode, state.compact, state.colorPrimary, state.borderRadius, state.themePresetId]);

  // 暗色下给 body 铺底色，避免弹层/路由切换露白
  useEffect(() => {
    document.body.style.background = resolvedMode === 'dark' ? '#0a0a0a' : '#f0f2f5';
  }, [resolvedMode]);

  // 从当前预设派生出 Header 背景色（无背景图时 Layout 用这个）
  const preset = findPreset(state.themePresetId);

  return (
    <ThemeContext.Provider
      value={{
        ...state,
        resolvedMode,
        headerBgColor: preset.headerBgColor,
        setMode,
        setCompact,
        setColorPrimary,
        setBorderRadius,
        applyPreset,
      }}
    >
      <ConfigProvider theme={themeConfig}>{children as ReactNode}</ConfigProvider>
    </ThemeContext.Provider>
  );
}
