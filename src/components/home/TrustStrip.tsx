import type { SiteSettings } from '@contracts';
import { serverFetch } from '@/lib/serverApi';
import styles from './TrustStrip.module.scss';

const DEFAULT_STATS = [
  { value: '12,400+', label: 'Curated listings' },
  { value: '850+', label: 'Verified agents' },
  { value: '40+', label: 'Active markets' },
  { value: '$4.2B', label: 'Closed last year' },
];

/** Slim trust bar that sits right below the hero. Server component. */
export async function TrustStrip() {
  const settings = await serverFetch<SiteSettings>('/settings', 0);
  const stats =
    settings && Array.isArray(settings.homeStats) && settings.homeStats.length === 4
      ? settings.homeStats
      : DEFAULT_STATS;

  return (
    <section className={styles.section} aria-label="OSK at a glance">
      <dl className={styles.grid}>
        {stats.map((stat, index) => (
          <div key={`stat-${index + 1}`} className={styles.cell}>
            <dt className={styles.value}>{stat.value}</dt>
            <dd className={styles.label}>{stat.label || `Stat ${index + 1}`}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
