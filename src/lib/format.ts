/** Presentation helpers — pure, framework-agnostic. */

export function formatPrice(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatArea(sqft?: number): string | null {
  if (!sqft) return null;
  return `${new Intl.NumberFormat('en-US').format(sqft)} sq ft`;
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
}
