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
  setMode: (mode: ThemeMode) => void;
  setCompact: (compact: boolean) => void;
  setColorPrimary: (color: string) => void;
  setBorderRadius: (radius: number) => void;
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

interface StoredTheme {
  mode: ThemeMode;
  compact: boolean;
  colorPrimary: string;
  borderRadius: number;
}

const FALLBACK: StoredTheme = {
  mode: 'auto',
  compact: false,
  colorPrimary: COLOR_PRESETS[0],
  borderRadius: DEFAULT_BORDER_RADIUS,
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
    return {
      mode: parsed.mode === 'dark' || parsed.mode === 'light' ? parsed.mode : 'auto',
      compact: parsed.compact === true,
      colorPrimary:
        typeof parsed.colorPrimary === 'string' ? parsed.colorPrimary : FALLBACK.colorPrimary,
      borderRadius:
        typeof parsed.borderRadius === 'number' ? parsed.borderRadius : FALLBACK.borderRadius,
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
  setMode: () => {},
  setCompact: () => {},
  setColorPrimary: () => {},
  setBorderRadius: () => {},
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

  const themeConfig = useMemo(
    () => ({
      algorithm: [
        resolvedMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        ...(state.compact ? [antdTheme.compactAlgorithm] : []),
      ],
      token: { colorPrimary: state.colorPrimary, borderRadius: state.borderRadius },
      components: {
        Menu: { itemBorderRadius: 0 },
      },
    }),
    [resolvedMode, state.compact, state.colorPrimary, state.borderRadius],
  );

  // 暗色下给 body 铺底色，避免弹层/路由切换露白
  useEffect(() => {
    document.body.style.background = resolvedMode === 'dark' ? '#0a0a0a' : '#f0f2f5';
  }, [resolvedMode]);

  return (
    <ThemeContext.Provider
      value={{ ...state, resolvedMode, setMode, setCompact, setColorPrimary, setBorderRadius }}
    >
      <ConfigProvider theme={themeConfig}>{children as ReactNode}</ConfigProvider>
    </ThemeContext.Provider>
  );
}
