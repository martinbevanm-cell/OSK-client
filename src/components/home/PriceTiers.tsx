'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { selectActiveCountry } from '@/features/geo';
import { useAppSelector } from '@/store/hooks';
import { currencyForCountry, currencySymbolForCountry } from '@/lib/geoData';
import { convertAmount } from '@/lib/fx';
import styles from './PriceTiers.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Quick-entry cards by price tier.
 *
 * The tier boundaries are authored in USD (the canonical pricing
 * currency the rest of OSK already uses for FX conversions). At
 * render time we:
 *   1. Read the user's selected country from the global geo slice.
 *   2. Look up that country's currency + symbol.
 *   3. Convert each USD bound into the local currency via the static
 *      FX table.
 *   4. Round to a sensible "round number" for the magnitude so we
 *      don't end up with "₹41,415,000 – ₹82,830,000" — we want
 *      "₹4Cr – ₹8Cr" / "₹40M – ₹80M" feel instead.
 *
 * The `href` querystring values stay in USD because the listings
 * search index stores prices in USD and the filter is exact. Showing
 * a local-currency label while filtering in USD is the same
 * compromise the pricing page already makes.
 * ──────────────────────────────────────────────────────────────── */

interface TierBounds {
  href: string;
  label: string;
  /** Lower bound in USD (inclusive). null = unbounded below. */
  minUsd: number | null;
  /** Upper bound in USD (exclusive). null = unbounded above. */
  maxUsd: number | null;
  blurb: string;
}

const TIERS: TierBounds[] = [
  {
    href: '/buy?priceMax=500000',
    label: 'Starter',
    minUsd: null,
    maxUsd: 500_000,
    blurb: 'First homes, condos, and starter rentals.',
  },
  {
    href: '/buy?priceMin=500000&priceMax=1000000',
    label: 'Family',
    minUsd: 500_000,
    maxUsd: 1_000_000,
    blurb: 'Move-up homes in established neighborhoods.',
  },
  {
    href: '/buy?priceMin=1000000&priceMax=3000000',
    label: 'Executive',
    minUsd: 1_000_000,
    maxUsd: 3_000_000,
    blurb: 'High-end homes and city lofts.',
  },
  {
    href: '/buy?priceMin=3000000',
    label: 'Luxury',
    minUsd: 3_000_000,
    maxUsd: null,
    blurb: 'Estates, penthouses, and trophy properties.',
  },
];

/** Round a converted number up to a clean magnitude — pick the
 *  largest power of ten ≤ the value and snap to the nearest "nice"
 *  multiple of it. Keeps tier labels readable in any currency. */
function roundNice(value: number): number {
  if (value <= 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  /* Snap to 1, 2, or 5 × magnitude — the same scheme chart axes use
   * for tidy tick marks. */
  const norm = value / magnitude;
  let snap: number;
  if (norm < 1.5) snap = 1;
  else if (norm < 3.5) snap = 2;
  else if (norm < 7.5) snap = 5;
  else snap = 10;
  return snap * magnitude;
}

/** "₹40,00,000" → "₹40L"; "$1,200,000" → "$1.2M"; "₦12,000,000" → "₦12M".
 *  Uses K/M/B suffixes for everything except INR/PKR which lean
 *  Lakh/Crore (₹1L = 100,000; ₹1Cr = 10,000,000). */
function compactFormat(amount: number, symbol: string, currency: string): string {
  const c = currency.toUpperCase();
  const indianStyle = c === 'INR' || c === 'PKR';
  if (indianStyle) {
    if (amount >= 1_00_00_000) {
      return `${symbol}${trim(amount / 1_00_00_000)}Cr`;
    }
    if (amount >= 1_00_000) {
      return `${symbol}${trim(amount / 1_00_000)}L`;
    }
    return `${symbol}${trim(amount)}`;
  }
  if (amount >= 1_000_000_000) return `${symbol}${trim(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `${symbol}${trim(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${symbol}${trim(amount / 1_000)}K`;
  return `${symbol}${trim(amount)}`;
}

/** Strip trailing zeros after the decimal so "1.0M" reads as "1M". */
function trim(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function formatRange(tier: TierBounds, symbol: string, currency: string): string {
  const min =
    tier.minUsd !== null ? roundNice(convertAmount(tier.minUsd, 'USD', currency)) : null;
  const max =
    tier.maxUsd !== null ? roundNice(convertAmount(tier.maxUsd, 'USD', currency)) : null;
  if (min === null && max !== null) {
    return `Under ${compactFormat(max, symbol, currency)}`;
  }
  if (min !== null && max === null) {
    return `${compactFormat(min, symbol, currency)} and up`;
  }
  if (min !== null && max !== null) {
    return `${compactFormat(min, symbol, currency)} – ${compactFormat(
      max,
      symbol,
      currency,
    )}`;
  }
  return '';
}

export function PriceTiers() {
  const activeCountry = useAppSelector(selectActiveCountry);
  const { currency, symbol } = useMemo(() => {
    const cur = currencyForCountry(activeCountry) || 'USD';
    const sym = currencySymbolForCountry(activeCountry) || '$';
    return { currency: cur, symbol: sym };
  }, [activeCountry]);

  return (
    <section className={styles.section} aria-labelledby="price-heading">
      <header className={styles.head}>
        <span className={styles.eyebrow}>By price</span>
        <h2 id="price-heading" className={styles.title}>
          Pick a <em>budget,</em> we&rsquo;ll take it from there.
        </h2>
      </header>

      <div className={styles.grid}>
        {TIERS.map((tier, index) => (
          <Link key={tier.href} href={tier.href} className={styles.card}>
            <span className={styles.tierIndex}>0{index + 1}</span>
            <p className={styles.tierLabel}>{tier.label}</p>
            <p className={styles.tierRange}>{formatRange(tier, symbol, currency)}</p>
            <p className={styles.tierBlurb}>{tier.blurb}</p>
            <span className={styles.tierArrow} aria-hidden="true">
              View homes →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
