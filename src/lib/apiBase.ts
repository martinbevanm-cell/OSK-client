const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? '/api/v1';

export function isAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveApiBasePath(): string {
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
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';
}
