import { describe, expect, it } from 'vitest';
import { formatArea, formatCompact, formatPrice } from '../format';

describe('formatPrice', () => {
  it('formats USD with no fractional digits by default', () => {
    expect(formatPrice(1_250_000)).toBe('$1,250,000');
  });

  it('respects a custom currency code', () => {
    /* The actual symbol depends on the ICU table — assert structure not glyph. */
    const out = formatPrice(995_000, 'EUR');
    expect(out).toMatch(/995,000/);
  });

  it('rounds away cents', () => {
    expect(formatPrice(999.6)).toBe('$1,000');
  });
});

describe('formatArea', () => {
  it('returns null for undefined or zero (a missing area should render nothing)', () => {
    expect(formatArea(undefined)).toBeNull();
    expect(formatArea(0)).toBeNull();
  });

  it('groups thousands and appends sq ft', () => {
    expect(formatArea(1_250)).toBe('1,250 sq ft');
  });
});

describe('formatCompact', () => {
  it('produces compact notation', () => {
    expect(formatCompact(1_200_000)).toBe('1.2M');
    expect(formatCompact(950)).toBe('950');
  });
});
