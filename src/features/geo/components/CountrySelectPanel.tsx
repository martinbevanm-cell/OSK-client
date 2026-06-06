'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { getCountries, type CountryOption } from '@/lib/geoData';
import styles from './CountrySelectPanel.module.scss';

interface CountrySelectPanelProps {
  /** Active country iso2 (e.g. `US`). */
  selected: string;
  onChange: (iso2: string) => void;
  close: () => void;
  /**
   * Optional ISO-2 allow-list. When provided, only countries in this
   * set are offered — used to enforce the marketplace's geographic
   * scope from `SiteSettings.geo.allowedCountries`. `null`/undefined
   * means "no restriction".
   */
  allowedIso2?: string[] | null;
}

/** Searchable + scrollable country list driven by `country-state-city`. */
export function CountrySelectPanel({
  selected,
  onChange,
  close,
  allowedIso2,
}: CountrySelectPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const allCountries = useMemo(() => getCountries(), []);
  /* Apply the admin-configured allow-list once, up front. We do it as a
   * Set lookup so the filter below is O(n) even with hundreds of codes. */
  const countries = useMemo(() => {
    if (!allowedIso2 || allowedIso2.length === 0) return allCountries;
    const allow = new Set(allowedIso2);
    return allCountries.filter((c) => allow.has(c.iso2));
  }, [allCountries, allowedIso2]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo<CountryOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    /* Match name OR iso2 OR phoneCode — handy for "+1", "US", "United". */
    return countries.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.iso2.toLowerCase().includes(q)) return true;
      if (c.phoneCode && c.phoneCode.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [countries, query]);

  const onPick = (iso2: string) => {
    onChange(iso2);
    close();
  };

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <span className={styles.searchIcon} aria-hidden="true">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path
              d="M9 3a6 6 0 014.47 9.99l3.27 3.27-1.06 1.06-3.27-3.27A6 6 0 119 3zm0 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
              fill="currentColor"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          className={styles.search}
          placeholder="Search by country, ISO or dial code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search countries"
        />
      </div>

      <ul className={styles.list} role="listbox" aria-label="Countries">
        {filtered.length === 0 ? (
          <li className={styles.empty}>
            No countries match &ldquo;{query.trim()}&rdquo;.
          </li>
        ) : (
          filtered.map((country) => {
            const active = country.iso2 === selected;
            return (
              <li key={country.iso2}>
                <button
                  type="button"
                  className={cn(styles.item, active && styles.itemActive)}
                  onClick={() => onPick(country.iso2)}
                  role="option"
                  aria-selected={active}
                >
                  <span className={styles.flag} aria-hidden="true">
                    {country.flag ?? '🌐'}
                  </span>
                  <span className={styles.itemName}>{country.name}</span>
                  <span className={styles.itemMeta}>
                    {country.currency}
                    {country.phoneCode ? ` · ${country.phoneCode}` : ''}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
