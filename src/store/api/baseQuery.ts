import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import type { AuthResult, ApiSuccess } from '@contracts';
// Import the slice directly (not the feature barrel) to avoid a module cycle:
// baseQuery → authApi → baseApi → baseQuery. The slice has no such imports.
import { credentialsRefreshed, loggedOut } from '@/features/auth/authSlice';
import type { RootState } from '../index';

function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return configured || '/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();

/** Raw query — attaches the in-memory access token and sends the refresh cookie. */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Single-flight guard so concurrent 401s trigger exactly one refresh. */
let refreshInFlight: ReturnType<typeof rawBaseQuery> | null = null;

/**
 * Base query with transparent refresh-token rotation:
 *  1. run the request
 *  2. on 401 → call /auth/refresh once (shared across concurrent callers)
 *  3. on success → store new credentials, retry the original request
 *  4. on failure → log the user out
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    refreshInFlight ??= rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    const refreshResult = await refreshInFlight;
    refreshInFlight = null;

    const body = refreshResult.data as ApiSuccess<AuthResult> | undefined;
    if (body?.success && body.data.accessToken) {
      api.dispatch(credentialsRefreshed(body.data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(loggedOut());
    }
  }

  return result;
};
