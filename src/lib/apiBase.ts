const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? '/api/v1';

export function isAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * For server-side rendering: use relative paths so Next.js rewrites proxy them to the backend.
 * Next.js rewrites only work for server-side requests, not browser fetch/XHR.
 */
export function resolveApiBasePathForServer(): string {
  if (!PUBLIC_API_BASE) return '/api/v1';
  if (isAbsoluteUrl(PUBLIC_API_BASE)) {
    try {
      const { pathname } = new URL(PUBLIC_API_BASE);
      return pathname.replace(/\/$/, '') || '/api/v1';
    } catch {
      return '/api/v1';
    }
  }
  return PUBLIC_API_BASE.startsWith('/') ? PUBLIC_API_BASE : `/${PUBLIC_API_BASE}`;
}

/**
 * For client-side requests: use the configured URL directly (preserving absolute URLs).
 * Browser requests to absolute URLs will be subject to CORS, which the backend should handle.
 * Relative URLs are also safe and will resolve to the frontend origin.
 */
export function resolveApiBasePathForClient(): string {
  if (!PUBLIC_API_BASE) return '/api/v1';
  if (isAbsoluteUrl(PUBLIC_API_BASE)) {
    try {
      const { pathname } = new URL(PUBLIC_API_BASE);
      return pathname.replace(/\/$/, '') || '/api/v1';
    } catch {
      return '/api/v1';
    }
  }
  return PUBLIC_API_BASE.startsWith('/') ? PUBLIC_API_BASE : `/${PUBLIC_API_BASE}`;
}

export function resolveApiOrigin(): string {
  if (isAbsoluteUrl(PUBLIC_API_BASE)) {
    try {
      return new URL(PUBLIC_API_BASE).origin;
    } catch {
      // fall through to site URL fallback
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://carsosk.com';
}

/**
 * Backward-compatible export: uses server path for build-time usage
 */
export const resolveApiBasePath = resolveApiBasePathForServer;
