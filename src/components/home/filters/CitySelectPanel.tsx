'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCitiesByCountry,
  searchCities,
  type CityOption,
} from '@/lib/geoData';
import { cn } from '@/lib/cn';
import styles from './CitySelectPanel.module.scss';

interface CitySelectPanelProps {
  /** ISO-2 country code whose cities populate the list. */
  countryIso2: string;
  /** Currently-selected city, or null when none. */
  selected: CityOption | null;
  onChange: (city: CityOption | null) => void;
  close: () => void;
}

/* `country-state-city` ships ~150k cities — even for one country the
 * dataset can have thousands of entries, so we cap the list and lean on
 * the search box to surface the right one. */
const MAX_RESULTS = 200;

/**
 * Searchable, dynamic city list. Cities come from the geoData wrapper —
 * no hardcoded lists — and are scoped to the active country.
 */
export function CitySelectPanel({
  countryIso2,
  selected,
  onChange,
  close,
}: CitySelectPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Reset the search when country flips so leftover query state doesn't
   * look like "no results" for the new dataset. */
  useEffect(() => {
    setQuery('');
  }, [countryIso2]);

  const all = useMemo(() => getCitiesByCountry(countryIso2), [countryIso2]);
  const filtered = useMemo<CityOption[]>(() => {
    const q = query.trim();
    if (!q) return all.slice(0, MAX_RESULTS);
    return searchCities(countryIso2, q, MAX_RESULTS);
  }, [all, countryIso2, query]);

  const onPick = (city: CityOption | null) => {
    onChange(city);
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
          placeholder={
            all.length > 0
              ? `Search ${all.length.toLocaleString('en-US')} cities…`
              : 'No cities for this country'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search cities"
          disabled={all.length === 0}
        />
      </div>

      <ul className={styles.list} role="listbox" aria-label="Cities">
        <li>
          <button
            type="button"
            className={cn(styles.item, !selected && styles.itemActive)}
            onClick={() => onPick(null)}
            role="option"
            aria-selected={!selected}
          >
            <span className={styles.itemName}>Any city</span>
            <span className={styles.itemMeta}>Show results everywhere</span>
          </button>
        </li>
        {all.length === 0 ? (
          <li className={styles.empty}>
            We don&rsquo;t have city data for this country yet.
          </li>
        ) : filtered.length === 0 ? (
          <li className={styles.empty}>No cities match &ldquo;{query.trim()}&rdquo;.</li>
        ) : (
          filtered.map((city) => {
            const active = selected?.key === city.key;
            return (
              <li key={city.key}>
                <button
                  type="button"
                  className={cn(styles.item, active && styles.itemActive)}
                  onClick={() => onPick(city)}
                  role="option"
                  aria-selected={active}
                >
                  <span className={styles.itemName}>{city.name}</span>
                  <span className={styles.itemMeta}>
                    {city.stateCode ?? city.iso2}
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
