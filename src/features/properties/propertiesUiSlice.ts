import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PropertyFilters } from '@contracts';

export type ListViewMode = 'grid' | 'list' | 'map';

/**
 * UI-only state for the listing experience — filters, sort, and view mode.
 * The actual property DATA is owned by propertiesApi (RTK Query), never here.
 */
interface PropertiesUiState {
  filters: Partial<PropertyFilters>;
  viewMode: ListViewMode;
}

const initialState: PropertiesUiState = {
  filters: { page: 1, limit: 24 },
  viewMode: 'grid',
};

const propertiesUiSlice = createSlice({
  name: 'propertiesUi',
  initialState,
  reducers: {
    filtersChanged: (state, action: PayloadAction<Partial<PropertyFilters>>) => {
      // Any filter change resets to page 1.
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    pageChanged: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
    },
    filtersReset: (state) => {
      state.filters = { page: 1, limit: state.filters.limit ?? 24 };
    },
    viewModeChanged: (state, action: PayloadAction<ListViewMode>) => {
      state.viewMode = action.payload;
    },
  },
  selectors: {
    selectFilters: (s) => s.filters,
    selectViewMode: (s) => s.viewMode,
  },
});

export const { filtersChanged, pageChanged, filtersReset, viewModeChanged } =
  propertiesUiSlice.actions;
export const { selectFilters, selectViewMode } = propertiesUiSlice.selectors;
export const propertiesUiReducer = propertiesUiSlice.reducer;
