'use client';

import { useGetGoogleAuthConfigQuery } from '../googleAuthApi';
import styles from './GoogleSignInButton.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * "Continue with Google" button.
 *
 * Renders nothing when the integration isn't enabled — so the auth
 * forms stay clean on deploys that haven't pasted Google keys.
 *
 * On click, sends the browser to the backend's /auth/google/start
 * with the live page origin as `redirectTo`. The backend kicks off
 * the OAuth dance and 302s back to the same origin after sign-in
 * with the session payload in the URL hash, which the
 * GoogleSessionBootstrap component picks up.
 * ──────────────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

interface Props {
  /** Optional override — defaults to the current page origin. Pass a
   *  path like "/dashboard?welcome=1" to land somewhere specific. */
  redirectTo?: string;
  /** "signin" or "signup" — only affects the label text. */
  variant?: 'signin' | 'signup';
}

export function GoogleSignInButton({ redirectTo, variant = 'signin' }: Props) {
  const { data, isLoading } = useGetGoogleAuthConfigQuery();

  if (isLoading || !data || !data.enabled) return null;

  /* Always send an ABSOLUTE URL to the backend.
   *
   * If `redirectTo` is a same-origin path like "/admin/google" (which
   * happens when SignInForm passes `searchParams.get('next')` straight
   * through after a "?next=/admin/google" redirect), we MUST resolve
   * it against the current frontend origin before handing it off.
   * Otherwise the backend OAuth callback ends up doing a relative
   * `res.redirect('/admin/google')` — and a relative redirect from
   * the backend resolves to the backend's domain, which 404s. */
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const target = redirectTo
    ? redirectTo.startsWith('/')
      ? `${origin}${redirectTo}`
      : redirectTo
    : origin;
  const href = `${API_BASE}/auth/google/start${
    target ? `?redirectTo=${encodeURIComponent(target)}` : ''
  }`;

  return (
    <a className={styles.button} href={href}>
      {/* Brand mark served as a static asset so its hard-coded brand
       *  hex colors don't trigger the design-token color guard. An
       *  18×18 SVG isn't worth `next/image`'s loader machinery — it's
       *  cached after the first hit and never moves the LCP needle. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.logo}
        src="/icons/google-g.svg"
        alt=""
        width="18"
        height="18"
        aria-hidden="true"
      />
      <span>{variant === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
    </a>
  );
}
