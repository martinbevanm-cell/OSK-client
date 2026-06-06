import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_COUNTRY } from '@/lib/geoData';

/**
 * Globally-shared "active country" — the user's chosen storefront.
 *
 * Selecting a country drives:
 *  • the city dropdown's dataset (only that country's cities)
 *  • the currency used by price inputs + range presets
 *  • the country-priority sort the backend applies to listings
 *
 * Stored as ISO 3166-1 alpha-2 (e.g. `US`, `CA`, `GB`). Persisted to
 * localStorage so the choice survives a refresh.
 */
interface GeoState {
  activeCountry: string;
}

const initialState: GeoState = {
  activeCountry: DEFAULT_COUNTRY,
};

const geoSlice = createSlice({
  name: 'geo',
  initialState,
  reducers: {
    activeCountryChanged: (state, action: PayloadAction<string>) => {
      /* Always store as upper-case ISO2 — single source of truth. */
      state.activeCountry = action.payload.toUpperCase();
    },
  },
  selectors: {
    selectActiveCountry: (s) => s.activeCountry,
  },
});

export const { activeCountryChanged } = geoSlice.actions;
export const { selectActiveCountry } = geoSlice.selectors;
export const geoReducer = geoSlice.reducer;
export type { GeoState };
