'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import styles from './FilterDropdown.module.scss';

interface FilterDropdownProps {
  /** Short label shown above the value (e.g. "Location"). */
  label: string;
  /** Current value rendered inside the trigger (e.g. "Any city"). */
  value: ReactNode;
  /** True when the trigger represents an active filter — gets a dot indicator. */
  active?: boolean;
  /** Width of the popover. Defaults to a comfortable 22rem. */
  panelWidth?: string;
  /** Align the popover against trigger's start/end edge. */
  align?: 'start' | 'end';
  /** Validation error rendered as a tooltip below the trigger. */
  error?: string;
  /** Icon rendered on the leading edge of the trigger. */
  icon?: ReactNode;
  /** Hides the leading icon column on narrow widths. */
  iconClassName?: string;
  className?: string;
  children: (close: () => void) => ReactNode;
}

/**
 * Trigger + popover used by every hero filter. Handles open/close, focus
 * return on close, ESC + outside click, and provides a `close()` callback
 * to children so panels can self-dismiss on Apply.
 */
export function FilterDropdown({
  label,
  value,
  active,
  panelWidth = '22rem',
  align = 'start',
  error,
  icon,
  iconClassName,
  className,
  children,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ left?: number; top?: number }>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the trigger for keyboard users.
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);

  // Outside click + ESC.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Keep the popover within the viewport while rendering it above the
  // hero/next sections via a portal mounted on document.body.
  useLayoutEffect(() => {
    if (!open) return;
    const syncPosition = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const triggerRect = trigger.getBoundingClientRect();
      const panelWidthPx = panel.offsetWidth;
      const viewport = window.innerWidth;
      const pad = 12;
      let left = align === 'end' ? triggerRect.right - panelWidthPx : triggerRect.left;
      left = Math.max(pad, Math.min(left, viewport - panelWidthPx - pad));
      setPanelStyle({
        left,
        top: triggerRect.bottom + 8,
      });
    };

    syncPosition();
    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition, true);
    return () => {
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition, true);
    };
  }, [open, align]);

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className={cn(styles.root, className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          styles.trigger,
          active && styles.triggerActive,
          error && styles.triggerInvalid,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        {icon ? (
          <span className={cn(styles.icon, iconClassName)} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={styles.text}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{value}</span>
        </span>
        <span className={styles.caret} aria-hidden="true">
          <svg viewBox="0 0 20 20" width="14" height="14">
            <path
              d="M5 7.5l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {error ? (
        <span className={styles.errorMsg} role="alert">
          {error}
        </span>
      ) : null}

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={label}
              className={styles.panel}
              style={{ inlineSize: panelWidth, ...panelStyle }}
            >
              {children(close)}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
