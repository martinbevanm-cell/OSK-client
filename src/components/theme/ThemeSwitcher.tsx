'use client';

import { useState } from 'react';
import { THEMES } from '@contracts';
import { selectTheme, themeChanged } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { THEME_LABELS } from '@/lib/theme';
import { cn } from '@/lib/cn';
import styles from './ThemeSwitcher.module.scss';

/**
 * Theme switcher. Each swatch is wrapped in that theme's own class, so the
 * preview color is read from `var(--color-primary)` of that theme — zero
 * hardcoded colors, fully token-driven.
 */
export function ThemeSwitcher() {
  const dispatch = useAppDispatch();
  const active = useAppSelector(selectTheme);
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={active} aria-hidden>
          <span className={styles.swatch} />
        </span>
        <span>{THEME_LABELS[active]}</span>
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label="Theme">
          {THEMES.map((t) => (
            <li key={t}>
              <button
                type="button"
                role="option"
                aria-selected={t === active}
                className={cn(styles.option, t === active && styles.optionActive)}
                onClick={() => {
                  dispatch(themeChanged(t));
                  setOpen(false);
                }}
              >
                <span className={t} aria-hidden>
                  <span className={styles.swatch} />
                </span>
                <span>{THEME_LABELS[t]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
