/**
 * Resolve a media URL to something an <img>/<video> tag can fetch.
 *
 * The backend returns relative paths like `/uploads/<hash>.jpg` for local
 * storage. The browser would resolve those against the Next.js frontend
 * (which doesn't serve them), so we prefix them with the API origin. Full
 * URLs (http://, https://, data:, blob:) pass through untouched.
 */
import { resolveApiBasePath, resolveApiOrigin } from '@/lib/apiBase';

const API_BASE = resolveApiBasePath();

/** Origin of the API server, derived from API_BASE_URL (strip the /api/v1). */
function apiOrigin(): string {
  return resolveApiOrigin();
}

export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (/^[a-z]+:/i.test(url)) return url; // already absolute (http, data, blob, etc.)
  if (url.startsWith('//')) return url;
  return `${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`;
}
