import type { Metadata } from 'next';
import { SavedListings } from './SavedListings';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'Saved Listings',
  description: 'The listings you’ve saved on OSK.',
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Your shortlist
        </p>
        <h1 className={styles.title}>
          <em>Saved</em> listings.
        </h1>
        <p className={styles.lede}>
          Everything you’ve tapped a heart on lives here — review, compare, and come back
          to it later. Saved items live on this device until you sign in to sync them.
        </p>
      </header>

      <SavedListings />
    </section>
  );
}
