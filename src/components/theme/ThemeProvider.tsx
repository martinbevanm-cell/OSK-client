'use client';

import { useEffect, type ReactNode } from 'react';
import { THEMES, type ThemeName } from '@contracts';
import { selectTheme, themeChanged } from '@/features/ui';
import { useGetSiteSettingsQuery } from '@/features/settings';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { THEME_STORAGE_KEY } from '@/lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
  /** Theme resolved server-side in app/layout.tsx — applied before paint. */
  serverTheme?: ThemeName;
}

/**
 * Keeps the Redux `ui.theme` value, the <html> class, and localStorage in
 * sync. The theme is now driven by /settings (admin-controlled) — Redux
 * is just the in-app cache and persistence is for offline first-paint.
 * Regular users have no way to change the theme; only admins via
 * /admin/settings.
 */
export function ThemeProvider({ children, serverTheme }: ThemeProviderProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const { data: settings } = useGetSiteSettingsQuery();

  /* On mount: take the server-resolved theme as truth so the Redux store
   * matches what ThemeScript already applied. */
  useEffect(() => {
    if (serverTheme && THEMES.includes(serverTheme) && serverTheme !== theme) {
      dispatch(themeChanged(serverTheme));
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* When /settings refreshes (admin just changed the theme on another
   * tab, or a fresh client load), reconcile to the admin's choice. */
  useEffect(() => {
    if (!settings) return;
    if (!THEMES.includes(settings.activeTheme)) return;
    if (settings.activeTheme !== theme) {
      dispatch(themeChanged(settings.activeTheme));
    }
  }, [settings, theme, dispatch]);

  /* Reflect Redux theme onto <html> + cache for offline first-paint. */
  useEffect(() => {
    const el = document.documentElement;
    THEMES.forEach((t) => el.classList.remove(t));
    el.classList.add(theme);
    el.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — class still applied for this session */
    }
  }, [theme]);

  return <>{children}</>;
}
