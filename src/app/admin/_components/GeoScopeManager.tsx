'use client';

import { useMemo, useState } from 'react';
import type { SiteSettingsGeo } from '@contracts';
import { useUpdateSiteSettingsMutation } from '@/features/settings';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import { getCountries, type CountryOption } from '@/lib/geoData';
import { cn } from '@/lib/cn';
import styles from './GeoScopeManager.module.scss';

interface Props {
  /** Current geo block from SiteSettings (loaded by the parent). */
  geo: SiteSettingsGeo;
}

/* ─────────────────────────────────────────────────────────────────────────
 * "Available countries" card.
 *
 *  - All countries          → mode='all' (every country bookable + browseable)
 *  - Specific countries     → mode='restricted' + a multi-pick set of ISO-2
 *
 * Changes are batched into a local draft; nothing hits the server until
 * the admin clicks Save. We also pre-fill the picker with the current
 * allow-list when switching from "all" → "restricted" so the admin
 * doesn't lose progress if they toggle accidentally.
 * ──────────────────────────────────────────────────────────────────────── */

export function GeoScopeManager({ geo }: Props) {
  const dispatch = useAppDispatch();
  const [save, { isLoading: saving }] = useUpdateSiteSettingsMutation();

  const [draftMode, setDraftMode] = useState<SiteSettingsGeo['mode']>(geo.mode);
  const [draftAllowed, setDraftAllowed] = useState<string[]>(geo.allowedCountries);
  const [search, setSearch] = useState('');

  const allCountries = useMemo(() => getCountries(), []);
  const filtered = useMemo<CountryOption[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q),
    );
  }, [allCountries, search]);

  const allowedSet = useMemo(() => new Set(draftAllowed), [draftAllowed]);
  const isDirty =
    draftMode !== geo.mode ||
    draftAllowed.length !== geo.allowedCountries.length ||
    draftAllowed.some((c) => !geo.allowedCountries.includes(c));

  const toggleCountry = (iso2: string) => {
    setDraftAllowed((prev) =>
      prev.includes(iso2) ? prev.filter((c) => c !== iso2) : [...prev, iso2],
    );
  };

  const clearAll = () => setDraftAllowed([]);
  const removeChip = (iso2: string) =>
    setDraftAllowed((prev) => prev.filter((c) => c !== iso2));

  const onSave = async () => {
    /* Refuse to save 'restricted' with an empty list — defaults to 'all'
     * would be more surprising than a clear validation message. */
    if (draftMode === 'restricted' && draftAllowed.length === 0) {
      dispatch(
        toastPushed('error', 'Pick at least one country before saving Specific mode.'),
      );
      return;
    }
    try {
      await save({
        geo: { mode: draftMode, allowedCountries: draftAllowed },
      }).unwrap();
      dispatch(toastPushed('success', 'Country scope updated.'));
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <h2 className={styles.title}>Available countries</h2>
        <p className={styles.sub}>
          Decide whether OSK is available worldwide or scoped to specific countries. In{' '}
          <strong>Specific</strong> mode, only the countries you pick here show up in the
          country dropdowns across the site, and the property list endpoint refuses to
          return listings from anywhere else.
        </p>
      </header>

      {/* ── mode picker ──────────────────────────────────────────── */}
      <div className={styles.modes} role="radiogroup" aria-label="Country scope">
        <button
          type="button"
          role="radio"
          aria-checked={draftMode === 'all'}
          className={cn(styles.modeCard, draftMode === 'all' && styles.modeOn)}
          onClick={() => setDraftMode('all')}
        >
          <span className={styles.modeName}>All countries</span>
          <span className={styles.modeSub}>
            Every country in the dataset is bookable and browseable.
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={draftMode === 'restricted'}
          className={cn(styles.modeCard, draftMode === 'restricted' && styles.modeOn)}
          onClick={() => setDraftMode('restricted')}
        >
          <span className={styles.modeName}>Specific countries</span>
          <span className={styles.modeSub}>
            Restrict to a curated list. Pick the countries below.
          </span>
        </button>
      </div>

      {/* ── allow-list picker ───────────────────────────────────── */}
      {draftMode === 'restricted' ? (
        <div className={styles.picker}>
          {/* Selected chips */}
          {draftAllowed.length > 0 ? (
            <ul className={styles.chips} aria-label="Selected countries">
              {draftAllowed.map((iso2) => {
                const c = allCountries.find((x) => x.iso2 === iso2);
                return (
                  <li key={iso2}>
                    <button
                      type="button"
                      className={styles.chip}
                      onClick={() => removeChip(iso2)}
                      title="Remove"
                    >
                      <span aria-hidden="true">{c?.flag ?? '🌐'}</span>
                      <span>{c?.name ?? iso2}</span>
                      <span className={styles.chipX} aria-hidden="true">
                        ×
                      </span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button type="button" className={styles.clearAll} onClick={clearAll}>
                  Clear all
                </button>
              </li>
            </ul>
          ) : (
            <p className={styles.empty}>
              No countries selected yet — pick from the list below.
            </p>
          )}

          {/* Search + grid */}
          <input
            type="search"
            className={styles.search}
            placeholder="Filter by country name or ISO code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter countries"
          />
          <ul className={styles.grid} role="listbox" aria-multiselectable>
            {filtered.map((c) => {
              const on = allowedSet.has(c.iso2);
              return (
                <li key={c.iso2}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={cn(styles.tile, on && styles.tileOn)}
                    onClick={() => toggleCountry(c.iso2)}
                  >
                    <span className={styles.tileFlag} aria-hidden="true">
                      {c.flag ?? '🌐'}
                    </span>
                    <span className={styles.tileName}>{c.name}</span>
                    <span className={styles.tileIso}>{c.iso2}</span>
                    {on ? (
                      <span className={styles.tileCheck} aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <footer className={styles.foot}>
        <Button type="button" size="sm" onClick={onSave} disabled={!isDirty || saving}>
          {saving ? 'Saving…' : isDirty ? 'Save country scope' : 'No changes'}
        </Button>
        <p className={styles.fine}>
          Existing listings outside the allowed set stay in the database but are hidden
          from public results — switch back to <em>All</em> to surface them again.
        </p>
      </footer>
    </section>
  );
}
