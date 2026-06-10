import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResult, SessionUser } from '@contracts';

/**
 * UI/session auth state. The access token lives in memory only; the refresh
 * token is an httpOnly cookie the JS layer never sees. Server state (the
 * actual login/register requests) lives in authApi (RTK Query).
 *
 * `impersonatedBy` is set when an admin "Impersonate"s another user — the
 * admin's original SessionUser + access token are stashed so they can
 * switch back without re-signing in.
 */
interface ImpersonationFrame {
  /** The admin's stashed identity for the "Stop impersonating" button. */
  adminUser: SessionUser;
  adminAccessToken: string;
  adminAccessTokenExpiresAt: string;
}

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  status: 'idle' | 'authenticated';
  impersonation: ImpersonationFrame | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,
  status: 'idle',
  impersonation: null,
};

const applyCredentials = (state: AuthState, payload: AuthResult) => {
  state.user = payload.user;
  state.accessToken = payload.accessToken;
  state.accessTokenExpiresAt = payload.accessTokenExpiresAt;
  state.status = 'authenticated';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set after a successful login/register. Clears any impersonation. */
    credentialsReceived: (state, action: PayloadAction<AuthResult>) => {
      applyCredentials(state, action.payload);
      state.impersonation = null;
    },
    /** Set after a silent refresh-token rotation. */
    credentialsRefreshed: (state, action: PayloadAction<AuthResult>) => {
      applyCredentials(state, action.payload);
    },
    /**
     * Admin starts impersonating `payload`. We stash the current (admin)
     * session before overlaying the target's. Re-impersonating without
     * stopping first is a no-op on the stashed frame — the original admin
     * is preserved.
     */
    impersonationStarted: (state, action: PayloadAction<AuthResult>) => {
      if (
        !state.impersonation &&
        state.user &&
        state.accessToken &&
        state.accessTokenExpiresAt
      ) {
        state.impersonation = {
          adminUser: state.user,
          adminAccessToken: state.accessToken,
          adminAccessTokenExpiresAt: state.accessTokenExpiresAt,
        };
      }
      applyCredentials(state, action.payload);
    },
    /** Restore the admin's stashed session. */
    impersonationStopped: (state) => {
      if (!state.impersonation) return;
      state.user = state.impersonation.adminUser;
      state.accessToken = state.impersonation.adminAccessToken;
      state.accessTokenExpiresAt = state.impersonation.adminAccessTokenExpiresAt;
      state.status = 'authenticated';
      state.impersonation = null;
    },
    /** Clear everything on logout or failed refresh. */
    loggedOut: () => initialState,
  },
  selectors: {
    selectCurrentUser: (s) => s.user,
    selectIsAuthenticated: (s) => Boolean(s.accessToken),
    selectUserRole: (s) => s.user?.role ?? null,
    selectIsImpersonating: (s) => s.impersonation !== null,
    selectImpersonatingAdmin: (s) => s.impersonation?.adminUser ?? null,
  },
});

export const {
  credentialsReceived,
  credentialsRefreshed,
  impersonationStarted,
  impersonationStopped,
  loggedOut,
} = authSlice.actions;
export const {
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
  selectIsImpersonating,
  selectImpersonatingAdmin,
} = authSlice.selectors;
export const authReducer = authSlice.reducer;
