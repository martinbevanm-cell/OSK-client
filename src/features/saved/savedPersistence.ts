/**
 * Saved-listings persistence.
 *
 * Lightweight bridge between the `saved` slice and `localStorage` so
 * the user's shortlist survives a refresh. SSR-safe (every read is
 * gated by a `typeof window` check) and silently degrades if storage
 * is unavailable.
 */
import type { Middleware } from '@reduxjs/toolkit';
import type { PropertySummary } from '@contracts';
import {
  saved,
  unsaved,
  clearSaved,
  selectSavedItems,
  type savedReducer,
} from './savedSlice';

const STORAGE_KEY = 'osk:saved:v1';

interface MiddlewareApi {
  getState: () => { saved: ReturnType<typeof savedReducer> };
}

/** Best-effort read of the persisted shortlist; never throws. */
export function loadSavedItems(): PropertySummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Defensive shape check — drop anything that doesn't at least look like
    // a PropertySummary so a stale schema can't corrupt the slice.
    // Also backfill any field added to PropertySummary AFTER the row was
    // persisted (e.g. `country`) so downstream components don't crash on
    // undefined / blow up the layout for legacy entries.
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          !!item &&
          typeof item === 'object' &&
          'id' in item &&
          'slug' in item &&
          'title' in item,
      )
      .map((item) => {
        const country =
          typeof (item as { country?: unknown }).country === 'string' &&
          (item as { country: string }).country.length > 0
            ? (item as { country: string }).country
            : 'US';
        return { ...item, country } as PropertySummary;
      });
  } catch {
    return [];
  }
}

function writeSavedItems(items: PropertySummary[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota, private mode, etc. — ignore */
  }
}

/**
 * Redux middleware that writes the saved-list to localStorage whenever a
 * save / unsave / clear action lands. Wired in `store/index.ts`.
 */
export const savedPersistMiddleware: Middleware =
  (api: MiddlewareApi) => (next) => (action) => {
    const result = next(action);
    const type = (action as { type?: unknown }).type;
    if (type === saved.type || type === unsaved.type || type === clearSaved.type) {
      writeSavedItems(selectSavedItems(api.getState()));
    }
    return result;
  };
