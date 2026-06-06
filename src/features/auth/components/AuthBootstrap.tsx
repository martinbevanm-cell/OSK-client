'use client';

import { useSessionQuery } from '../authApi';

/**
 * Restores the session on app load. Calling `useSessionQuery` triggers
 * GET /auth/session; if there is no access token, the base query's reauth
 * flow silently exchanges the refresh cookie first. Renders nothing.
 */
export function AuthBootstrap() {
  useSessionQuery();
  return null;
}
