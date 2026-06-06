'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { CitySelectPanel, FilterDropdown, RangePanel, type RangeValue } from './filters';
import {
  AREA_PRESETS_SQFT,
  LISTING_INTENTS,
  PRICE_PRESETS_BUY,
  PRICE_PRESETS_RENT,
  PROPERTY_CATEGORIES,
  formatPriceCompact,
  formatSqFt,
  type ListingIntent,
  type PropertyCategory,
} from './heroSearch.data';
import { CityIcon, GlobeIcon, PriceIcon, RulerIcon, SearchIcon } from './HeroIcons';
import {
  CountrySelectPanel,
  activeCountryChanged,
  selectActiveCountry,
  useAllowedCountries,
} from '@/features/geo';
import { currencySymbolForCountry, getCountry, type CityOption } from '@/lib/geoData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';
import styles from './HeroSearch.module.scss';

/**
 * Three core property categories — Rentals isn't a property kind in this
 * UI; "Rent" is handled by the top intent tab, while the available types
 * (Homes / Plots / Commercial) stay the same regardless of buy vs. rent.
 */
const VISIBLE_CATEGORIES = PROPERTY_CATEGORIES.filter((c) => c.id !== 'rentals');

/* ─────────────────────────────────────────────────────────────────────────
 * Validation. Each dropdown enforces its own internal rules; this schema
 * is the final gate before we build a query string.
 * ──────────────────────────────────────────────────────────────────────── */

const formSchema = z
  .object({
    intent: z.enum(['buy', 'rent', 'new-projects']),
    country: z.string().length(2),
    cityName: z.string().nullable(),
    location: z
      .string()
      .max(80, 'Location is too long')
      .optional()
      .transform((v) => v?.trim() ?? ''),
    categoryId: z.string(),
    subcategoryIds: z.array(z.string()),
    priceMin: z.number().int().nonnegative().nullable(),
    priceMax: z.number().int().nonnegative().nullable(),
    areaMin: z.number().int().nonnegative().nullable(),
    areaMax: z.number().int().nonnegative().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.priceMin !== null &&
      data.priceMax !== null &&
      data.priceMin >= data.priceMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceMax'],
        message: 'Max price must be greater than min',
      });
    }
    if (data.areaMin !== null && data.areaMax !== null && data.areaMin >= data.areaMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['areaMax'],
        message: 'Max size must be greater than min',
      });
    }
  });

interface FieldErrors {
  location?: string;
  price?: string;
  area?: string;
}

const EMPTY_RANGE: RangeValue = { min: null, max: null };

/* ─────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────── */

export function HeroSearch() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeCountry = useAppSelector(selectActiveCountry);
  const [hydrated, setHydrated] = useState(false);
  /* Admin-restricted country allow-list, if any. `null` = show all. */
  const allowedCountries = useAllowedCountries();

  const [intent, setIntent] = useState<ListingIntent>('buy');
  const [city, setCity] = useState<CityOption | null>(null);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<PropertyCategory>(VISIBLE_CATEGORIES[0]!);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<RangeValue>(EMPTY_RANGE);
  const [area, setArea] = useState<RangeValue>(EMPTY_RANGE);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setHydrated(true);
  }, []);

  const displayCountry = hydrated ? activeCountry : 'US';

  /* Whenever the user switches country, drop the city selection (it
   * belonged to the previous country) and reset price (currency changed,
   * so the previous numeric bounds may no longer mean what they meant). */
  useEffect(() => {
    setCity(null);
    setPrice(EMPTY_RANGE);
  }, [activeCountry]);

  const country = useMemo(
    () => getCountry(displayCountry) ?? getCountry('US')!,
    [displayCountry],
  );
  const currencySymbol = useMemo(
    () => currencySymbolForCountry(displayCountry),
    [displayCountry],
  );

  const cityLabel = city
    ? city.stateCode
      ? `${city.name}, ${city.stateCode}`
      : city.name
    : 'Any city';

  const countryLabel = `${country.flag ?? ''} ${country.name}`.trim();

  const priceLabel = useMemo(
    () =>
      formatRangeLabel(price, (v) => formatPriceCompact(v, currencySymbol), 'Any price'),
    [price, currencySymbol],
  );
  const areaLabel = useMemo(() => formatRangeLabel(area, formatSqFt, 'Any size'), [area]);

  const pricePresets = intent === 'rent' ? PRICE_PRESETS_RENT : PRICE_PRESETS_BUY;
  const priceUnitHint = intent === 'rent' ? ' /mo' : '';
  const priceValue =
    priceLabel === 'Any price' ? priceLabel : `${priceLabel}${priceUnitHint}`;

  const onCategory = (cat: PropertyCategory) => {
    if (cat.id !== category.id) {
      setCategory(cat);
      setPicked(new Set()); // sub-categories are scoped to a category
    }
  };

  const togglePicked = (subId: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = formSchema.safeParse({
      intent,
      country: activeCountry,
      cityName: city?.name ?? null,
      location,
      categoryId: category.id,
      subcategoryIds: Array.from(picked),
      priceMin: price.min,
      priceMax: price.max,
      areaMin: area.min,
      areaMax: area.max,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'location') next.location = issue.message;
        else if (key === 'priceMin' || key === 'priceMax') next.price = issue.message;
        else if (key === 'areaMin' || key === 'areaMax') next.area = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});

    const route = LISTING_INTENTS.find((i) => i.id === intent)?.route ?? '/buy';
    const params = new URLSearchParams();
    params.set('intent', intent);
    params.set('country', parsed.data.country);
    if (parsed.data.cityName) params.set('city', parsed.data.cityName);
    if (parsed.data.location) params.set('q', parsed.data.location);
    params.set('category', parsed.data.categoryId);
    if (parsed.data.subcategoryIds.length > 0) {
      params.set('subcategory', parsed.data.subcategoryIds.join(','));
    }
    if (parsed.data.priceMin !== null)
      params.set('priceMin', String(parsed.data.priceMin));
    if (parsed.data.priceMax !== null)
      params.set('priceMax', String(parsed.data.priceMax));
    if (parsed.data.areaMin !== null) params.set('areaMin', String(parsed.data.areaMin));
    if (parsed.data.areaMax !== null) params.set('areaMax', String(parsed.data.areaMax));

    router.push(`${route}?${params.toString()}`);
  };

  /* ─── render ─────────────────────────────────────────────────────── */

  return (
    <form className={styles.shell} role="search" onSubmit={onSubmit} noValidate>
      {/* Top-level intent tabs — sit above the card, drive everything. */}
      <div className={styles.tabs} role="tablist" aria-label="Listing intent">
        {LISTING_INTENTS.map((opt) => {
          const active = opt.id === intent;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(styles.tab, active && styles.tabActive)}
              onClick={() => setIntent(opt.id as ListingIntent)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className={styles.card}>
        {/* Row 1 — Country + City + Location + Search */}
        <div className={styles.row1}>
          <div className={styles.row1Cell}>
            <FilterDropdown
              label="Country"
              value={countryLabel}
              active={displayCountry !== 'US'}
              icon={<GlobeIcon />}
              panelWidth="22rem"
            >
              {(close) => (
                <CountrySelectPanel
                  selected={activeCountry}
                  onChange={(iso2) => dispatch(activeCountryChanged(iso2))}
                  allowedIso2={allowedCountries}
                  close={close}
                />
              )}
            </FilterDropdown>
          </div>

          <div className={styles.row1Cell}>
            <FilterDropdown
              label="City"
              value={cityLabel}
              active={!!city}
              icon={<CityIcon />}
            >
              {(close) => (
                <CitySelectPanel
                  countryIso2={activeCountry}
                  selected={city}
                  onChange={setCity}
                  close={close}
                />
              )}
            </FilterDropdown>
          </div>

          <label
            className={cn(
              styles.row1Cell,
              styles.location,
              errors.location && styles.locationInvalid,
            )}
          >
            <span className={styles.locationLabel}>Location</span>
            <span className={styles.locationShell}>
              <span className={styles.locationIcon} aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                type="search"
                className={styles.locationInput}
                placeholder="Neighborhood, ZIP, or street address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Search by neighborhood, ZIP, or street address"
                maxLength={80}
              />
            </span>
            {errors.location ? (
              <span className={styles.fieldError} role="alert">
                {errors.location}
              </span>
            ) : null}
          </label>

          <Button type="submit" size="lg" className={cn(styles.row1Cell, styles.submit)}>
            <SearchIcon />
            <span>Search</span>
          </Button>
        </div>

        {/* Row 2 — Property type tabs + sub-type chips + Price + Area */}
        <div className={styles.row2}>
          <div className={styles.typeRow}>
            <div className={styles.typeTabs} role="tablist" aria-label="Property type">
              {VISIBLE_CATEGORIES.map((cat) => {
                const active = cat.id === category.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={cn(styles.typeTab, active && styles.typeTabActive)}
                    onClick={() => onCategory(cat)}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className={styles.ranges}>
              <FilterDropdown
                label={intent === 'rent' ? 'Monthly Rent' : 'Price'}
                value={priceValue}
                active={price.min !== null || price.max !== null}
                icon={<PriceIcon />}
                error={errors.price}
                panelWidth="28rem"
                align="end"
              >
                {(close) => (
                  <RangePanel
                    minLabel="Min"
                    maxLabel="Max"
                    presets={pricePresets}
                    prefix={currencySymbol}
                    value={price}
                    onChange={setPrice}
                    close={close}
                  />
                )}
              </FilterDropdown>

              <FilterDropdown
                label="Size (sq ft)"
                value={areaLabel}
                active={area.min !== null || area.max !== null}
                icon={<RulerIcon />}
                error={errors.area}
                panelWidth="28rem"
                align="end"
              >
                {(close) => (
                  <RangePanel
                    minLabel="Min"
                    maxLabel="Max"
                    presets={AREA_PRESETS_SQFT}
                    suffix="sq ft"
                    value={area}
                    onChange={setArea}
                    close={close}
                  />
                )}
              </FilterDropdown>
            </div>
          </div>

          {/* Sub-type chips for the active category — toggle multi-select. */}
          <div
            className={styles.chips}
            role="group"
            aria-label={`${category.label} sub-types`}
          >
            {category.subcategories.map((sub) => {
              const isPicked = picked.has(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  className={cn(styles.chip, isPicked && styles.chipActive)}
                  onClick={() => togglePicked(sub.id)}
                  aria-pressed={isPicked}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */

function formatRangeLabel(
  range: RangeValue,
  format: (value: number) => string,
  empty: string,
): string {
  if (range.min === null && range.max === null) return empty;
  if (range.min !== null && range.max !== null) {
    return `${format(range.min)} – ${format(range.max)}`;
  }
  if (range.min !== null) return `${format(range.min)}+`;
  return `Up to ${format(range.max!)}`;
}
