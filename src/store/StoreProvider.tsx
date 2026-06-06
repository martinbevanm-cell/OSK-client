'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './index';
import { activeCountryChanged, loadActiveCountry } from '@/features/geo';

/**
 * Client boundary that owns the Redux store. Created once per client via a
 * ref so the store survives re-renders but is never shared across requests.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  storeRef.current ??= makeStore();

  useEffect(() => {
    const persistedCountry = loadActiveCountry();
    storeRef.current?.dispatch(activeCountryChanged(persistedCountry));
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
