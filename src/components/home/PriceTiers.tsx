import Link from 'next/link';
import styles from './PriceTiers.module.scss';

interface Tier {
  href: string;
  label: string;
  range: string;
  blurb: string;
}

const TIERS: Tier[] = [
  {
    href: '/buy?priceMax=500000',
    label: 'Starter',
    range: 'Under $500K',
    blurb: 'First homes, condos, and starter rentals.',
  },
  {
    href: '/buy?priceMin=500000&priceMax=1000000',
    label: 'Family',
    range: '$500K – $1M',
    blurb: 'Move-up homes in established neighborhoods.',
  },
  {
    href: '/buy?priceMin=1000000&priceMax=3000000',
    label: 'Executive',
    range: '$1M – $3M',
    blurb: 'High-end homes and city lofts.',
  },
  {
    href: '/buy?priceMin=3000000',
    label: 'Luxury',
    range: '$3M and up',
    blurb: 'Estates, penthouses, and trophy properties.',
  },
];

/** Quick-entry cards by price tier. Server component. */
export function PriceTiers() {
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
            <p className={styles.tierRange}>{tier.range}</p>
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
