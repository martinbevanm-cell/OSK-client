import { THEMES } from '@contracts';
import { THEME_STORAGE_KEY } from '@/lib/theme';

/**
 * Blocking inline script placed in <head>. Applies the persisted theme class
 * to <html> BEFORE first paint — eliminates any flash of the wrong theme.
 * Server component (renders static markup only).
 */
export function ThemeScript({ defaultTheme }: { defaultTheme: string }) {
  const js = `(function(){try{var allow=${JSON.stringify(THEMES)};var stored=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});var theme=allow.indexOf(stored)>-1?stored:${JSON.stringify(
    defaultTheme,
  )};var el=document.documentElement;allow.forEach(function(t){el.classList.remove(t);});el.classList.add(theme);el.setAttribute('data-theme',theme);}catch(e){document.documentElement.classList.add(${JSON.stringify(
    defaultTheme,
  )});}})();`;

  return <script dangerouslySetInnerHTML={{ __html: js }} suppressHydrationWarning />;
}
