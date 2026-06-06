import type { ThemeName } from '@contracts';

/** localStorage key shared by ThemeScript (pre-paint) and ThemeProvider. */
export const THEME_STORAGE_KEY = 'osk-theme';

/** Human labels for the theme switcher. */
export const THEME_LABELS: Record<ThemeName, string> = {
  'theme-luxe-light': 'Luxe Light',
  'theme-luxe-dark': 'Luxe Dark',
  'theme-emerald': 'Emerald',
  'theme-sandstone': 'Sandstone',
};
