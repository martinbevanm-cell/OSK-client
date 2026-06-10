import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PropertySummary } from '@contracts';

/**
 * In-memory saved-listings slice.
 *
 * Stores a snapshot of each saved PropertySummary so the /saved page can
 * render cards without an extra round-trip per listing. State persists
 * across navigation but not page refresh — wire redux-persist or a
 * localStorage middleware later when accounts ship.
 */
interface SavedState {
  /** Ordered most-recent-first. */
  items: PropertySummary[];
}

const initialState: SavedState = {
  items: [],
};

const savedSlice = createSlice({
  name: 'saved',
  initialState,
  reducers: {
    saved: (state, action: PayloadAction<PropertySummary>) => {
      const exists = state.items.some((p) => p.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    unsaved: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    clearSaved: (state) => {
      state.items = [];
    },
  },
  selectors: {
    selectSavedItems: (s) => s.items,
    selectSavedCount: (s) => s.items.length,
    selectIsSaved: (s, id: string) => s.items.some((p) => p.id === id),
  },
});

export const { saved, unsaved, clearSaved } = savedSlice.actions;
export const { selectSavedItems, selectSavedCount, selectIsSaved } = savedSlice.selectors;
export const savedReducer = savedSlice.reducer;
