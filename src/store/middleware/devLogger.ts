import type { Middleware } from '@reduxjs/toolkit';

/**
 * Dev-only action logger. Compiled out of meaningful work in production
 * (the body short-circuits), so it is safe to leave in the middleware chain.
 */
export const devLogger: Middleware = () => (next) => (action) => {
  if (process.env.NODE_ENV !== 'production') {
    const type =
      typeof action === 'object' && action !== null && 'type' in action
        ? String((action as { type: unknown }).type)
        : 'unknown';
    console.debug('[redux]', type);
  }
  return next(action);
};
