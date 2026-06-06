'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import styles from './ListingDropdown.module.scss';

interface ListingDropdownProps {
  /** Short label rendered before the value (e.g. "Sort by"). */
  label: string;
  /** Current value rendered inside the trigger. */
  value: string;
  /** True when the dropdown is filtering on a non-default value. */
  active?: boolean;
  /** Anchor the popover to the start or end edge of the trigger. */
  align?: 'start' | 'end';
  /** Inline-size of the popover. */
  panelWidth?: string;
  className?: string;
  /** Render-prop receives a `close()` callback so panels can self-dismiss. */
  children: (close: () => void) => ReactNode;
}

/**
 * Compact pill-shaped dropdown used in the listings toolbar.
 * Mirrors the hero `FilterDropdown` look but a slimmer trigger (no icon
 * column), so multiple can fit on a single toolbar line.
 */
export function ListingDropdown({
  label,
  value,
  active,
  align = 'end',
  panelWidth = '16rem',
  className,
  children,
}: ListingDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  const close = () => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  /* outside-click + ESC */
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={wrapRef} className={cn(styles.root, className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(styles.trigger, active && styles.triggerActive)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
      >
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        <span className={styles.caret} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12">
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className={cn(styles.panel, align === 'end' && styles.alignEnd)}
          style={{ inlineSize: panelWidth }}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
