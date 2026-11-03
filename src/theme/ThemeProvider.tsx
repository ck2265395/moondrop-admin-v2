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

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  colorPrimary: string;
  setMode: (mode: ThemeMode) => void;
  setColorPrimary: (color: string) => void;
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

function readStored(): { mode: ThemeMode; colorPrimary: string } {
  const fallback = { mode: 'light' as ThemeMode, colorPrimary: COLOR_PRESETS[0] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      colorPrimary: typeof parsed.colorPrimary === 'string' ? parsed.colorPrimary : fallback.colorPrimary,
    };
  } catch {
    return fallback;
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colorPrimary: COLOR_PRESETS[0],
  setMode: () => {},
  setColorPrimary: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(readStored);

  const setMode = useCallback((mode: ThemeMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setColorPrimary = useCallback((colorPrimary: string) => {
    setState((prev) => ({ ...prev, colorPrimary }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const themeConfig = useMemo(
    () => ({
      algorithm: state.mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: { colorPrimary: state.colorPrimary },
    }),
    [state],
  );

  // 暗色下给 body 铺底色，避免弹层/路由切换露白
  useEffect(() => {
    document.body.style.background = state.mode === 'dark' ? '#0a0a0a' : '#f0f2f5';
  }, [state.mode]);

  return (
    <ThemeContext.Provider value={{ ...state, setMode, setColorPrimary }}>
      <ConfigProvider theme={themeConfig}>{children as ReactNode}</ConfigProvider>
    </ThemeContext.Provider>
  );
}
