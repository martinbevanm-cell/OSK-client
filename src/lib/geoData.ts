/**
 * Real country + city dataset, bundled (no network calls).
 *
 * Powered by the `country-state-city` package — ~250 countries and 150k+
 * cities, all keyed by ISO 3166-1 alpha-2 country codes. Wrapping it in a
 * thin module here keeps the rest of the app from importing the dataset
 * directly: if we ever switch providers, only this file changes.
 */
import { Country, City } from 'country-state-city';

/** A country option as the UI renders it. */
export interface CountryOption {
  /** ISO 3166-1 alpha-2 — e.g. 'US', 'CA', 'GB'. */
  iso2: string;
  name: string;
  /** Display string of the currency the country uses, e.g. 'USD'. */
  currency: string;
  /** Currency symbol — e.g. '$', '€'. */
  symbol: string;
  /** International dialing code, e.g. '+1'. */
  phoneCode?: string;
  /** Unicode flag, e.g. '🇺🇸'. */
  flag?: string;
  /** Country centroid latitude (deg). Falls back to 0 if unknown. */
  lat: number;
  /** Country centroid longitude (deg). Falls back to 0 if unknown. */
  lng: number;
}

export interface CityOption {
  /** Unique-ish key for React lists. */
  key: string;
  name: string;
  iso2: string;
  /** State / region code, when the dataset has it. */
  stateCode?: string;
  /** Latitude (deg), if the underlying dataset has it. */
  lat?: number;
  /** Longitude (deg), if the underlying dataset has it. */
  lng?: number;
}

/* ──────────────────────────────────────────────────────────────────────
 * Countries
 * ────────────────────────────────────────────────────────────────────── */

/* The country-state-city package only ships currency codes, not symbols.
 * For the common currencies we hand-map a symbol — for everything else
 * the code itself is the display ("ZAR", "AED" …). */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  MXN: 'MX$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AED: 'د.إ',
  SAR: '﷼',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  RUB: '₽',
  TRY: '₺',
  ZAR: 'R',
  BRL: 'R$',
  KRW: '₩',
  THB: '฿',
  PHP: '₱',
  IDR: 'Rp',
  MYR: 'RM',
  PKR: '₨',
  BDT: '৳',
  LKR: 'Rs',
  NGN: '₦',
  EGP: '£',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  ILS: '₪',
};

function symbolFor(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

let _countries: CountryOption[] | null = null;

/** Every country, sorted alphabetically by name. Memoized on first call. */
export function getCountries(): CountryOption[] {
  if (_countries) return _countries;
  _countries = Country.getAllCountries()
    .map((c) => {
      const currency = (c.currency || 'USD').toUpperCase();
      const lat = c.latitude ? Number(c.latitude) : NaN;
      const lng = c.longitude ? Number(c.longitude) : NaN;
      return {
        iso2: c.isoCode,
        name: c.name,
        currency,
        symbol: symbolFor(currency),
        phoneCode: c.phonecode
          ? c.phonecode.startsWith('+')
            ? c.phonecode
            : `+${c.phonecode}`
          : undefined,
        flag: c.flag,
        lat: Number.isFinite(lat) ? lat : 0,
        lng: Number.isFinite(lng) ? lng : 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return _countries;
}

/** Lookup by ISO2 — returns undefined for unknown codes. */
export function getCountry(iso2: string): CountryOption | undefined {
  const code = iso2.toUpperCase();
  return getCountries().find((c) => c.iso2 === code);
}

/** Currency for a country, e.g. 'US' → 'USD'. Falls back to 'USD'. */
export function currencyForCountry(iso2: string): string {
  return getCountry(iso2)?.currency ?? 'USD';
}

/** Symbol for a country's currency, e.g. 'US' → '$'. */
export function currencySymbolForCountry(iso2: string): string {
  return getCountry(iso2)?.symbol ?? '$';
}

/* ──────────────────────────────────────────────────────────────────────
 * Cities
 * ────────────────────────────────────────────────────────────────────── */

const _citiesByCountry = new Map<string, CityOption[]>();

/**
 * Cities for a single country. The package's full city list is large
 * (~150k rows total) — we lazy-load per-country and cache so the first
 * read of each country pays the cost once.
 */
export function getCitiesByCountry(iso2: string): CityOption[] {
  if (!iso2) return [];
  const code = iso2.toUpperCase();
  const cached = _citiesByCountry.get(code);
  if (cached) return cached;
  const raw = City.getCitiesOfCountry(code) ?? [];
  /* The dataset has duplicates (same city name in different states) and
   * we don't want them in a flat dropdown. De-dupe by (name + state). */
  const seen = new Set<string>();
  const out: CityOption[] = [];
  for (const c of raw) {
    const key = `${c.name}::${c.stateCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const lat = c.latitude ? Number(c.latitude) : NaN;
    const lng = c.longitude ? Number(c.longitude) : NaN;
    out.push({
      key,
      name: c.name,
      iso2: c.countryCode,
      stateCode: c.stateCode,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  _citiesByCountry.set(code, out);
  return out;
}

/**
 * Resolve a city by name within a country. Case-insensitive — useful for
 * form submission when the user has typed (rather than picked) a city.
 * Returns the first match, or undefined.
 */
export function findCity(iso2: string, name: string): CityOption | undefined {
  if (!iso2 || !name) return undefined;
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  return getCitiesByCountry(iso2).find((c) => c.name.toLowerCase() === target);
}

/**
 * Filter the country's cities by a search query. Returns the top `limit`
 * matches with a "starts-with" preference so the most relevant items
 * surface first. Case-insensitive.
 */
export function searchCities(iso2: string, query: string, limit = 50): CityOption[] {
  const all = getCitiesByCountry(iso2);
  if (!query.trim()) return all.slice(0, limit);
  const q = query.toLowerCase();
  const starts: CityOption[] = [];
  const contains: CityOption[] = [];
  for (const city of all) {
    const lower = city.name.toLowerCase();
    if (lower.startsWith(q)) starts.push(city);
    else if (lower.includes(q)) contains.push(city);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Default country at first run if no preference is stored anywhere. */
export const DEFAULT_COUNTRY: string = 'US';
