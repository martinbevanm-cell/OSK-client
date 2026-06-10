/**
 * Pull a user-friendly message out of an RTK Query error.
 * Mirrors the logic in store/listenerMiddleware so forms surface the
 * same sentence the (suppressed) toast would have shown.
 */
interface RtkErrorShape {
  status?: number | string;
  data?: {
    error?: {
      message?: string;
      details?: Array<{ field?: string; message?: string }>;
    };
  };
}

function humanFieldLabel(field: string): string {
  const leaf = field.split('.').pop() ?? field;
  return leaf
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function getAuthErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as RtkErrorShape;
  const detail = e.data?.error?.details?.[0];
  if (detail?.message) {
    return detail.field && detail.field !== '_root'
      ? `${humanFieldLabel(detail.field)}: ${detail.message}`
      : detail.message;
  }
  const msg = e.data?.error?.message;
  if (msg) return msg;
  const status = typeof e.status === 'number' ? e.status : 0;
  if (e.status === 'FETCH_ERROR')
    return 'Couldn’t reach the auth server. Check your network and backend/API configuration.';
  if (status === 401) return 'Invalid email or password.';
  if (status === 409) return 'An account with this email already exists.';
  if (status === 422) return 'Please review the highlighted fields.';
  if (status === 429) return 'Too many requests — please slow down.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Couldn’t complete the request. Please try again.';
}
