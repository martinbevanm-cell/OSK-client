import { createListenerMiddleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { toastPushed } from '@/features/ui';

/**
 * Side-effect layer. The single global error-reporting hook lives here:
 * every failed RTK Query request raises a `rejectedWithValue` action,
 * which this listener turns into a user toast and forwards to error
 * tracking.
 */
export const listenerMiddleware = createListenerMiddleware();

/** Sentry-compatible hook point. Wire `Sentry.captureException` here. */
function reportError(scope: string, detail: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[error:${scope}]`, detail);
  }
  // TODO(observability): Sentry.captureException(detail, { tags: { scope } });
}

interface RtkRejection {
  status?: number | string;
  data?: {
    error?: {
      code?: string;
      message?: string;
      details?: Array<{ field?: string; message?: string }>;
    };
  };
}

/** Map common status codes / error codes to a friendlier sentence. */
function friendlyMessage(payload: RtkRejection | undefined): string {
  const err = payload?.data?.error;
  /* If the backend already validated and gave us field-level details,
   * surface the first one so the user knows exactly what to fix. */
  const first = err?.details?.[0];
  if (first?.message) {
    return first.field && first.field !== '_root'
      ? `${humanFieldLabel(first.field)}: ${first.message}`
      : first.message;
  }
  if (err?.message) return err.message;

  /* Fallback by status when the envelope wasn't surfaced (network etc.). */
  const status = typeof payload?.status === 'number' ? payload.status : 0;
  if (payload?.status === 'FETCH_ERROR')
    return 'Couldn’t reach the server. Check your network and backend/API configuration.';
  if (status === 401) return 'You need to sign in to continue.';
  if (status === 403) return 'You don’t have permission to do that.';
  if (status === 404) return 'That resource wasn’t found.';
  if (status === 409) return 'That conflicts with an existing record.';
  if (status === 422) return 'Please review the highlighted fields.';
  if (status === 429) return 'Too many requests — please slow down.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Something went wrong. Please try again.';
}

function humanFieldLabel(field: string): string {
  const leaf = field.split('.').pop() ?? field;
  return leaf
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Forms that handle their own error UI — suppress the global toast. */
const SILENT_ENDPOINTS = new Set([
  'login',
  'register',
  'session',
  'forgotPassword',
  'resetPassword',
  'verifyEmail',
]);

listenerMiddleware.startListening({
  matcher: isRejectedWithValue,
  effect: (action, api) => {
    const meta = (action as { meta?: { arg?: { endpointName?: string } } }).meta;
    const endpointName = meta?.arg?.endpointName;

    const payload = action.payload as RtkRejection | undefined;
    const message = friendlyMessage(payload);
    const status = typeof payload?.status === 'number' ? payload.status : 0;
    const expectedSession401 = endpointName === 'session' && status === 401;

    if (expectedSession401) {
      // Visiting public pages while signed out is normal: session bootstrap
      // can 401 and should not appear as an app error.
      return;
    }

    if (!endpointName || !SILENT_ENDPOINTS.has(endpointName)) {
      api.dispatch(toastPushed('error', message));
    }
    if (!endpointName || !SILENT_ENDPOINTS.has(endpointName)) {
      reportError('rtk-query', action.payload);
    }
  },
});
