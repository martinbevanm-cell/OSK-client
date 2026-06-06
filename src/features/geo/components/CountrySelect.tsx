'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { getCountries, getCountry } from '@/lib/geoData';
import { CountrySelectPanel } from './CountrySelectPanel';
import styles from './CountrySelect.module.scss';

interface CountrySelectProps {
  /** Visible label above the control (`Country` by default). */
  label?: string;
  /** Selected ISO-2 country code. */
  value: string;
  onChange: (iso2: string) => void;
  /** Optional id for label `htmlFor`. */
  id?: string;
  /** Render with a compact ghost style — used inside the page header strip. */
  variant?: 'default' | 'ghost';
  className?: string;
  /** When true, hides the visible label (still rendered for screen readers). */
  hideLabel?: boolean;
  /**
   * Optional ISO-2 allow-list passed straight through to the panel.
   * Use `useAllowedCountries()` to derive the right value from
   * SiteSettings — pass the result here.
   */
  allowedIso2?: string[] | null;
}

/**
 * Self-contained country picker — trigger + popover. Use in forms,
 * dashboards, or anywhere you need country selection outside the hero
 * filter card (which composes CountrySelectPanel inside FilterDropdown).
 */
export function CountrySelect({
  label = 'Country',
  value,
  onChange,
  id,
  variant = 'default',
  className,
  hideLabel = false,
  allowedIso2,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const country = useMemo(() => getCountry(value) ?? getCountries()[0]!, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerClasses = cn(
    styles.trigger,
    variant === 'ghost' && styles.triggerGhost,
  );

  return (
    <div className={cn(styles.root, className)}>
      {!hideLabel ? (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      ) : (
        <span id={id} className={styles.visuallyHidden}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={triggerClasses}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.flag} aria-hidden="true">
          {country.flag ?? '🌐'}
        </span>
        <span className={styles.text}>
          <span className={styles.name}>{country.name}</span>
          <span className={styles.meta}>
            {country.iso2} · {country.currency}
            {country.phoneCode ? ` · ${country.phoneCode}` : ''}
          </span>
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

      {open ? (
        <div ref={panelRef} role="dialog" aria-label={label} className={styles.panel}>
          <CountrySelectPanel
            selected={value}
            onChange={onChange}
            allowedIso2={allowedIso2}
            close={() => {
              setOpen(false);
              queueMicrotask(() => triggerRef.current?.focus());
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
