import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import { authReducer } from '@/features/auth';
import { uiReducer } from '@/features/ui';
import { propertiesUiReducer } from '@/features/properties';
import { savedReducer } from '@/features/saved';
import { geoReducer } from '@/features/geo';

/**
 * Root reducer.
 *  - baseApi.reducer  → ALL server state (RTK Query cache)
 *  - everything else  → UI/session state slices
 *
 * To add a feature: create its slice, export the reducer from the feature
 * barrel, and add one line here.
 */
export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  ui: uiReducer,
  propertiesUi: propertiesUiReducer,
  saved: savedReducer,
  geo: geoReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
