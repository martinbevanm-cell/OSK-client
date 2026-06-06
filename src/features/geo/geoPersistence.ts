/**
 * Active-country persistence.
 *
 * Mirrors the saved-listings persistence pattern: read on store bootstrap,
 * write on every action that mutates the slice. SSR-safe — every storage
 * access is gated by a `typeof window` check.
 */
import type { Middleware } from '@reduxjs/toolkit';
import { DEFAULT_COUNTRY } from '@/lib/geoData';
import { activeCountryChanged, type GeoState } from './geoSlice';

const STORAGE_KEY = 'osk:geo:v1';

interface MiddlewareApi {
  getState: () => { geo: GeoState };
}

/** Best-effort read of the persisted country; never throws. */
export function loadActiveCountry(): string {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COUNTRY;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string' && parsed.length === 2) {
      return parsed.toUpperCase();
    }
    /* legacy / corrupt — fall back to the default */
    return DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

function writeActiveCountry(country: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(country));
  } catch {
    /* quota / private mode — ignore */
  }
}

/**
 * Redux middleware that mirrors `geo.activeCountry` into localStorage
 * whenever it changes. Wired into the store in `store/index.ts`.
 */
export const geoPersistMiddleware: Middleware =
  (api: MiddlewareApi) => (next) => (action) => {
    const result = next(action);
    const type = (action as { type?: unknown }).type;
    if (type === activeCountryChanged.type) {
      writeActiveCountry(api.getState().geo.activeCountry);
    }
    return result;
  };
