import type { Metadata } from 'next';
import { PricingPlans } from './PricingPlans';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the OSK plan that fits how you list.',
};

export default function PricingPage() {
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Pricing
        </p>
        <h1 className={styles.title}>Pick a plan that fits how you list.</h1>
        <p className={styles.lede}>
          Every plan ships with the same buyer-side tools. Pick a tier based on how many
          listings you publish, how many agents you run, and whether you want premium
          placement.
        </p>
      </header>

      <PricingPlans />
    </section>
  );
}
