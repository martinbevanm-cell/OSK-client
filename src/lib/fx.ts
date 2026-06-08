/**
 * Display-only currency conversion.
 *
 * This module exists so the pricing page can render a "feels local"
 * number — e.g. "≈ CA$135" — for a plan that's actually priced in
 * USD. The rates here are deliberately approximate and intended as
 * a UX hint, not a billing input. Real charges always go through a
 * canonical billing currency (see osk-backend BILLING_CURRENCIES).
 *
 * Rates expressed as "1 USD = N <currency>". To convert from another
 * canonical currency we route via USD: amount / RATE[from] * RATE[to].
 *
 * These numbers should be refreshed every few months — they're
 * approximate enough that the UI must always show the canonical
 * "Billed at X Y" caption alongside the converted display amount.
 */
export const USD_FX_RATES: Record<string, number> = {
  USD: 1,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.51,
  NGN: 1550,
  GHS: 14.5,
  ZAR: 18.6,
  KES: 130,
  /* Common locale currencies we don't bill in but want to display in. */
  INR: 83,
  PKR: 280,
  AED: 3.67,
  SAR: 3.75,
  EGP: 49,
  TRY: 32,
  BRL: 5.1,
  MXN: 17,
  JPY: 155,
  CNY: 7.2,
  HKD: 7.8,
  SGD: 1.34,
  CHF: 0.9,
  NZD: 1.64,
  SEK: 10.7,
  NOK: 10.7,
  DKK: 6.85,
  PLN: 3.95,
};

/**
 * Convert an amount from one currency to another using the static
 * USD-pivot table. Returns the original amount unchanged when either
 * currency is missing from the table — that way the UI still has
 * something to render rather than NaN.
 */
export function convertAmount(amount: number, from: string, to: string): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return amount;
  const fromRate = USD_FX_RATES[f];
  const toRate = USD_FX_RATES[t];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

/**
 * Pick the price from a plan that's closest to `preferred` for display
 * purposes. Preference order:
 *   1. Exact match.
 *   2. The first price (admins tend to lead with the canonical one).
 */
export function pickDisplayPrice<T extends { currency: string; amount: number }>(
  prices: T[],
  preferred: string,
): T | undefined {
  if (prices.length === 0) return undefined;
  const exact = prices.find((p) => p.currency.toUpperCase() === preferred.toUpperCase());
  return exact ?? prices[0];
}
