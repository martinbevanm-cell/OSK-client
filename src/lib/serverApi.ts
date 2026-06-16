import type { ApiSuccess } from '@contracts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
const SERVER_FETCH_TIMEOUT_MS = 5000;

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Server-side fetch for React Server Components. Uses Next's data cache via
 * `revalidate` and optional cache `tags` so a server action can force a
 * specific endpoint to re-read after a write. Returns `null` on any
 * failure so callers render a fallback instead of throwing — keeps pages
 * resilient while the backend is a shell.
 *
 * Pass `tags: ['site-settings']` on the call site, then call
 * `revalidateTag('site-settings')` from a server action after a write to
 * make every server-rendered consumer (Footer, contact page, etc.) pull
 * fresh data on the next render.
 */
export async function serverFetch<T>(
  path: string,
  revalidate: number | false = 60,
  tags: string[] = [],
): Promise<T | null> {
  const timeout = createTimeoutSignal(SERVER_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate, tags },
      signal: timeout.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as ApiSuccess<T>;
    return body.success ? body.data : null;
  } catch {
    return null;
  } finally {
    timeout.cleanup();
  }
}

/** Tag names used to invalidate specific server-fetched endpoints. */
export const FETCH_TAGS = {
  siteSettings: 'site-settings',
  pricingSettings: 'pricing-settings',
} as const;
