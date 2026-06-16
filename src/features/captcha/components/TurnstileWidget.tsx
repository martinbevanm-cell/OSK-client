'use client';

import { useEffect, useId, useRef } from 'react';
import styles from './TurnstileWidget.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Cloudflare Turnstile widget.
 *
 *  - Self-contained: lazy-loads the script tag on mount.
 *  - Calls `onToken('')` when the challenge resets or expires so the
 *    parent form can re-disable submit.
 *  - Cleans up on unmount by calling window.turnstile.remove().
 *  - Re-renders if siteKey changes (admin swap-out).
 *
 * Theming: Turnstile only accepts `light | dark | auto`; we pass
 * `auto` so it follows the OS — far cleaner than wiring our SCSS
 * theme system into a third-party iframe.
 * ──────────────────────────────────────────────────────────────── */

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileGlobal {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      appearance?: 'always' | 'execute' | 'interaction-only';
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

interface Props {
  siteKey: string;
  onToken: (token: string) => void;
}

/** Ensures the api.js script is added once per page. */
function ensureScriptLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`,
  );
  if (existing) {
    return new Promise<void>((resolve) => {
      existing.addEventListener('load', () => resolve(), { once: true });
    });
  }

  return new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export function TurnstileWidget({ siteKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const id = useId();
  /* Track latest onToken in a ref so the Turnstile callbacks always
   * see the current closure — without that the parent form would
   * receive a stale token-setter on re-renders. */
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let cancelled = false;
    if (!siteKey) return;

    ensureScriptLoaded().then(() => {
      if (cancelled) return;
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'auto',
        appearance: 'always',
        callback: (token) => onTokenRef.current(token),
        'error-callback': () => onTokenRef.current(''),
        'expired-callback': () => onTokenRef.current(''),
        'timeout-callback': () => onTokenRef.current(''),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* harmless — Turnstile sometimes throws on already-removed ids */
        }
        widgetIdRef.current = null;
      }
    };
     
  }, [siteKey]);

  return <div ref={containerRef} id={`turnstile-${id}`} className={styles.widget} />;
}
