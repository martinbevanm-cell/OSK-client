'use client';

import { useEffect, useMemo } from 'react';
import { useGetSiteSettingsQuery } from '@/features/settings';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { activeCountryChanged, selectActiveCountry } from './geoSlice';

/**
 * Effective country allow-list from site settings + an automatic
 * sanity-check on `activeCountry`.
 *
 *  - When `mode === 'all'` (or settings haven't loaded), returns `null`
 *    — meaning "no restriction, every country in the dataset is OK".
 *  - When `mode === 'restricted'` and the list is non-empty, returns
 *    the uppercase ISO-2 codes. If the user's persisted `activeCountry`
 *    isn't in the allowed set, we dispatch a correction to the first
 *    allowed code so the rest of the UI never shows an off-list pick.
 *
 * Components can simply destructure `allowed` and pass it to
 * `<CountrySelect allowedIso2={allowed}>`.
 */
export function useAllowedCountries(): string[] | null {
  const { data: settings } = useGetSiteSettingsQuery();
  const activeCountry = useAppSelector(selectActiveCountry);
  const dispatch = useAppDispatch();

  const allowed = useMemo<string[] | null>(() => {
    const geo = settings?.geo;
    if (!geo) return null;
    if (geo.mode !== 'restricted') return null;
    if (geo.allowedCountries.length === 0) return null;
    return geo.allowedCountries;
  }, [settings]);

  /* Self-correct the persisted activeCountry whenever the allow-list
   * shrinks or changes. We only update when truly necessary so this
   * doesn't fight with the user picking a country. */
  useEffect(() => {
    if (!allowed) return;
    if (allowed.includes(activeCountry)) return;
    const first = allowed[0];
    if (first) dispatch(activeCountryChanged(first));
  }, [allowed, activeCountry, dispatch]);

  return allowed;
}
