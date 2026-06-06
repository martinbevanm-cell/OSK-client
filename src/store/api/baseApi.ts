import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { API_TAGS } from './tags';

/**
 * The single RTK Query API instance. Feature APIs extend it with
 * `baseApi.injectEndpoints(...)` — adding endpoints never touches the store.
 *
 * This is the centralized API base layer: auth refresh and global error
 * handling live in `baseQueryWithReauth`; cache tags live in `tags.ts`.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: API_TAGS,
  // Endpoints are injected per-feature — see features/<domain>/<domain>Api.ts
  endpoints: () => ({}),
  refetchOnReconnect: true,
});
