'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ListingKind, PropertyType } from '@contracts';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Same-feature siblings — direct imports to avoid a self-referential cycle.
import { US_CITIES } from '@/components/home/heroSearch.data';
import {
  CountrySelect,
  activeCountryChanged,
  selectActiveCountry,
  useAllowedCountries,
} from '@/features/geo';
import { getCountry } from '@/lib/geoData';
import { useListPropertiesQuery } from '../propertiesApi';
import {
  filtersChanged,
  filtersReset,
  pageChanged,
  selectFilters,
  selectViewMode,
  viewModeChanged,
} from '../propertiesUiSlice';
import { ListingDropdown } from './ListingDropdown';
import { PropertyResultsMap } from './PropertyResultsMap';
import styles from './PropertyExplorer.module.scss';

/** Translate a city slug (e.g. `new-york-ny`) to the canonical city name
 *  the backend stores (e.g. `New York`). Returns the input untouched if no
 *  mapping is found, so plain names also pass through. */
function resolveCity(slugOrName: string): string {
  const match = US_CITIES.find((c) => c.id === slugOrName);
  return match?.name ?? slugOrName;
}

interface PropertyExplorerProps {
  title: string;
  subtitle: string;
  /** Page-owned property type. Omit for cross-type views (e.g. /new-projects). */
  type?: PropertyType;
  /** When set, forces this listingKind and hides the kind sub-tabs. */
  lockedListingKind?: ListingKind;
  /** Eyebrow text override — used by cross-type pages like New Projects. */
  eyebrow?: string;
}

/* ─── option lists ───────────────────────────────────────────────────── */

const KIND_TABS: { value: ListingKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new-project', label: 'New Projects' },
  { value: 'resale', label: 'Resale' },
];

type SortValue = NonNullable<ReturnType<typeof selectFilters>['sort']>;
const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
];

const BED_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: 'Any' },
  { value: 1, label: '1+ Bedrooms' },
  { value: 2, label: '2+ Bedrooms' },
  { value: 3, label: '3+ Bedrooms' },
  { value: 4, label: '4+ Bedrooms' },
  { value: 5, label: '5+ Bedrooms' },
];

const EYEBROW: Record<PropertyType, string> = {
  home: 'For Sale',
  rental: 'For Rent',
  commercial: 'Commercial',
  plot: 'Plots & Land',
};

/* ────────────────────────────────────────────────────────────────────── */

export function PropertyExplorer({
  title,
  subtitle,
  type,
  lockedListingKind,
  eyebrow,
}: PropertyExplorerProps) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const filters = useAppSelector(selectFilters);
  const viewMode = useAppSelector(selectViewMode);
  const activeCountry = useAppSelector(selectActiveCountry);
  /* Admin-restricted country allow-list (or null if unrestricted). The
   * hook also self-corrects `activeCountry` when it falls outside the
   * set, so the explorer never holds a stale off-list country. */
  const allowedCountries = useAllowedCountries();

  /* Cross-country opt-in. Off by default, so the explorer hard-filters to
   * the user's country and an empty result surfaces a friendly CTA. The
   * user clicks "Show listings worldwide" to flip this on for the current
   * page — we don't change the global `activeCountry` so other surfaces
   * still feel personalised. Reset whenever the country changes so each
   * new country starts in country-only mode. */
  const [worldwide, setWorldwide] = useState(false);
  useEffect(() => {
    setWorldwide(false);
  }, [activeCountry]);

  const activeCountryName = useMemo(
    () => getCountry(activeCountry)?.name ?? activeCountry,
    [activeCountry],
  );

  /* Hydrate filters from the URL on mount + whenever query params change.
   * The hero search bar drives these params on submit, so users land on
   * /buy?country=…&q=…&city=…&priceMin=…&priceMax=… and the toolbar
   * reflects them. A `country` param is the strongest signal — it also
   * updates the global slice so every other surface picks it up. */
  useEffect(() => {
    const q = searchParams.get('q') ?? undefined;
    const cityParam = searchParams.get('city') ?? undefined;
    const countryParam = searchParams.get('country');
    const intentParam = searchParams.get('intent');
    const priceMinRaw = searchParams.get('priceMin');
    const priceMaxRaw = searchParams.get('priceMax');
    const bedsRaw = searchParams.get('beds') ?? searchParams.get('bedrooms');

    if (countryParam && countryParam.length === 2) {
      /* Update the global slice from the URL — keeps the header + form +
       * filter view all on the same country. */
      dispatch(activeCountryChanged(countryParam.toUpperCase()));
    }

    const next: Parameters<typeof filtersChanged>[0] = {
      q,
      city: cityParam ? resolveCity(cityParam) : undefined,
    };

    if (lockedListingKind) {
      next.listingKind = lockedListingKind;
    } else if (intentParam === 'new-projects') {
      next.listingKind = 'new-project';
    } else if (intentParam === 'rent' || intentParam === 'buy') {
      next.listingKind = undefined;
    }

    if (priceMinRaw) {
      const n = Number(priceMinRaw);
      if (Number.isFinite(n) && n >= 0) next.minPrice = n;
    }
    if (priceMaxRaw) {
      const n = Number(priceMaxRaw);
      if (Number.isFinite(n) && n >= 0) next.maxPrice = n;
    }
    if (bedsRaw) {
      const n = Number(bedsRaw);
      if (Number.isFinite(n) && n >= 0) next.bedrooms = n;
    }

    dispatch(filtersChanged(next));
  }, [dispatch, searchParams, lockedListingKind]);

  /* Build the query the backend sees. Country is a HARD filter when
   * present, so we only include it when the user hasn't opted into
   * worldwide browsing for the current explorer. */
  const queryArgs = {
    ...filters,
    ...(worldwide ? {} : { country: activeCountry }),
    ...(type ? { type } : {}),
  };
  const { data, isLoading, isError, isFetching } = useListPropertiesQuery(queryArgs);

  const items = data?.items ?? [];
  const meta = data?.meta;

  const activeKind = filters.listingKind ?? 'all';
  const activeSort: SortValue = filters.sort ?? '-createdAt';
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.value === activeSort)?.label ?? 'Newest first';
  const activeBeds = filters.bedrooms;
  const activeBedsLabel = BED_OPTIONS.find((b) => b.value === activeBeds)?.label ?? 'Any';

  /* Beds filter applies for residential types or cross-type pages
   * (most new-project listings are residential). */
  const showBedsFilter = type === undefined || type === 'home' || type === 'rental';
  /* Kind tabs hide when the page locks the listingKind. */
  const showKindTabs = !lockedListingKind;
  /* Locked filters are not considered "active" — they don't show in Clear. */
  const filtersActive =
    (!lockedListingKind && !!filters.listingKind) ||
    !!filters.bedrooms ||
    !!filters.city ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    (!!filters.sort && filters.sort !== '-createdAt') ||
    !!filters.q;

  return (
    <section className={styles.explorer}>
      {/* ── header ─────────────────────────────────────────────────── */}
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          {eyebrow ?? (type ? EYEBROW[type] : 'Inventory')}
        </p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {/* ── toolbar ────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.count}>
            {meta
              ? `${meta.total.toLocaleString('en-US')} ${
                  meta.total === 1 ? 'listing' : 'listings'
                }`
              : isLoading
                ? 'Loading…'
                : '—'}
          </span>
          {showKindTabs ? (
            <>
              <span className={styles.toolbarSep} aria-hidden="true" />
              <div className={styles.tabs} role="tablist" aria-label="Listing kind">
                {KIND_TABS.map((tab) => {
                  const isActive = activeKind === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={cn(styles.tab, isActive && styles.tabActive)}
                      onClick={() =>
                        dispatch(
                          filtersChanged({
                            listingKind: tab.value === 'all' ? undefined : tab.value,
                          }),
                        )
                      }
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.toolbarFilters}>
            {worldwide ? (
              /* Worldwide mode — replace the country selector with an
               * active "Worldwide" pill that doubles as a way back to the
               * single-country view. */
              <button
                type="button"
                className={styles.worldwidePill}
                onClick={() => setWorldwide(false)}
                title={`Show only ${activeCountryName} listings`}
              >
                <span className={styles.worldwidePillIcon} aria-hidden="true">
                  🌐
                </span>
                <span className={styles.worldwidePillText}>
                  <span className={styles.worldwidePillLabel}>Country</span>
                  <span className={styles.worldwidePillValue}>Worldwide</span>
                </span>
              </button>
            ) : (
              <CountrySelect
                value={activeCountry}
                onChange={(iso2) => dispatch(activeCountryChanged(iso2))}
                variant="ghost"
                hideLabel
                allowedIso2={allowedCountries}
                className={styles.countryControl}
              />
            )}
            {showBedsFilter ? (
              <ListingDropdown
                label="Beds"
                value={activeBedsLabel}
                active={activeBeds != null}
                panelWidth="14rem"
              >
                {(close) => (
                  <ul className={styles.optionList} role="listbox" aria-label="Bedrooms">
                    {BED_OPTIONS.map((opt) => {
                      const isActive = activeBeds === opt.value;
                      return (
                        <li key={String(opt.value)}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            className={cn(styles.option, isActive && styles.optionActive)}
                            onClick={() => {
                              dispatch(filtersChanged({ bedrooms: opt.value }));
                              close();
                            }}
                          >
                            <span>{opt.label}</span>
                            {isActive ? <CheckIcon /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ListingDropdown>
            ) : null}

            <ListingDropdown
              label="Sort by"
              value={activeSortLabel}
              active={activeSort !== '-createdAt'}
              panelWidth="16rem"
            >
              {(close) => (
                <ul className={styles.optionList} role="listbox" aria-label="Sort by">
                  {SORT_OPTIONS.map((opt) => {
                    const isActive = activeSort === opt.value;
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={cn(styles.option, isActive && styles.optionActive)}
                          onClick={() => {
                            dispatch(filtersChanged({ sort: opt.value }));
                            close();
                          }}
                        >
                          <span>{opt.label}</span>
                          {isActive ? <CheckIcon /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ListingDropdown>

            {filtersActive ? (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => dispatch(filtersReset())}
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div
            className={cn(styles.viewToggle, styles.toolbarView)}
            role="tablist"
            aria-label="View"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'grid'}
              className={cn(styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive)}
              onClick={() => dispatch(viewModeChanged('grid'))}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <rect
                  x="1.5"
                  y="1.5"
                  width="5.5"
                  height="5.5"
                  rx="0.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <rect
                  x="9"
                  y="1.5"
                  width="5.5"
                  height="5.5"
                  rx="0.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <rect
                  x="1.5"
                  y="9"
                  width="5.5"
                  height="5.5"
                  rx="0.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <rect
                  x="9"
                  y="9"
                  width="5.5"
                  height="5.5"
                  rx="0.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              <span>Grid</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'map'}
              className={cn(styles.viewBtn, viewMode === 'map' && styles.viewBtnActive)}
              onClick={() => dispatch(viewModeChanged('map'))}
              title="Map view"
              aria-label="Map view"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M5.5 2L1 4v10l4.5-2 5 2L15 12V2l-4.5 2-5-2zm0 0v10m5-8v10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── grid / states ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className={styles.grid} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className={styles.state}>
          <p className={styles.stateTitle}>We couldn’t load listings.</p>
          <p className={styles.stateMsg}>Please try again in a moment.</p>
        </div>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        !worldwide ? (
          /* Empty in the user's country — offer to expand search. */
          <div className={cn(styles.state, styles.stateCountry)}>
            <span className={styles.stateIcon} aria-hidden="true">
              <svg viewBox="0 0 32 32" width="36" height="36">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path
                  d="M3 16h26M16 3c4 4 4 22 0 26M16 3c-4 4-4 22 0 26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <p className={styles.stateTitle}>No listings in {activeCountryName} yet</p>
            <p className={styles.stateMsg}>
              We don&rsquo;t have anything matching your search in {activeCountryName}{' '}
              right now. Want to browse listings from other countries?
            </p>
            <div className={styles.stateActions}>
              <Button type="button" onClick={() => setWorldwide(true)}>
                Show listings worldwide
              </Button>
              {filtersActive ? (
                <button
                  type="button"
                  className={styles.inlineClear}
                  onClick={() => dispatch(filtersReset())}
                >
                  Or reset your filters
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          /* Worldwide is already on and there's still nothing — likely an
           * over-narrow filter. */
          <div className={styles.state}>
            <p className={styles.stateTitle}>No listings match these filters.</p>
            <p className={styles.stateMsg}>
              Try widening your search or
              <button
                type="button"
                className={styles.inlineClear}
                onClick={() => dispatch(filtersReset())}
              >
                reset all filters
              </button>
              .
            </p>
          </div>
        )
      ) : null}

      {/* When worldwide is on, drop a persistent banner above results so the
       * user knows the country filter is currently relaxed. We don't repeat
       * the active country here — the toolbar chip already advertises the
       * mode and the "Show {country} only" button names it. */}
      {worldwide && items.length > 0 ? (
        <div className={styles.worldwideBanner} role="status">
          <span>
            Showing listings from <strong>every country</strong>.
          </span>
          <button
            type="button"
            className={styles.inlineClear}
            onClick={() => setWorldwide(false)}
          >
            Show {activeCountryName} only
          </button>
        </div>
      ) : null}

      {items.length > 0 && viewMode === 'grid' ? (
        <div className={cn(styles.grid, isFetching && styles.gridBusy)}>
          {items.map((property, index) => (
            <PropertyCard key={property.id} property={property} priority={index < 3} />
          ))}
        </div>
      ) : null}

      {items.length > 0 && viewMode === 'map' ? (
        <div className={cn(isFetching && styles.gridBusy)}>
          <PropertyResultsMap properties={items} />
        </div>
      ) : null}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => dispatch(pageChanged(meta.page - 1))}
          >
            Previous
          </Button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.page >= meta.pages}
            onClick={() => dispatch(pageChanged(meta.page + 1))}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
