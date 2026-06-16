'use client';

import { useEffect, useRef } from 'react';
import { credentialsReceived } from '@/features/auth';
import { useAppDispatch } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import type { AuthResult } from '@contracts';

/* ─────────────────────────────────────────────────────────────────
 * GoogleSessionBootstrap.
 *
 * The Google OAuth callback redirects the user back here with a
 * session payload encoded in the URL hash (#osk_session=...). Hash
 * fragments stay out of server access logs, so this is the safest
 * place to ferry the freshly-minted access token from the backend
 * into the in-memory Redux store.
 *
 * Mount this once near the top of the tree (e.g. inside the auth
 * provider used by the marketing + dashboard layouts). It's a no-op
 * on every render except when the URL hash actually contains the
 * marker.
 *
 * The refresh token is delivered separately as an httpOnly cookie by
 * the callback, so we don't need to handle it here.
 * ──────────────────────────────────────────────────────────────── */

const HASH_PREFIX = '#osk_session=';

export function GoogleSessionBootstrap() {
  const dispatch = useAppDispatch();
  /* useRef prevents the effect from re-running when StrictMode
   * double-mounts in dev. */
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (typeof window === 'undefined') return;
    const { hash } = window.location;
    if (!hash || !hash.startsWith(HASH_PREFIX)) return;

    handled.current = true;
    try {
      const encoded = hash.slice(HASH_PREFIX.length);
      const payload = JSON.parse(decodeURIComponent(encoded)) as AuthResult;
      if (
        payload &&
        typeof payload.accessToken === 'string' &&
        payload.user &&
        typeof payload.user.email === 'string'
      ) {
        dispatch(credentialsReceived(payload));
        dispatch(toastPushed('success', 'Signed in with Google.'));
      }
    } catch {
      /* malformed hash — ignore silently rather than alarm the user */
    } finally {
      /* Strip the hash so it doesn't leak into bookmarks or shared URLs.
       * Use replaceState so we don't add a history entry. */
      const cleaned = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleaned);
    }
  }, [dispatch]);

  return null;
}
