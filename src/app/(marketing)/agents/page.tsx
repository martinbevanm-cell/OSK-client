import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { AgentsDirectory } from '@/features/agents';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'Find an Agent',
  description: 'Work with verified OSK real-estate agents in your market.',
};

const STATS = [
  { value: '850+', label: 'Verified agents' },
  { value: '40+', label: 'Markets covered' },
  { value: '4.9★', label: 'Median rating' },
  { value: '92%', label: 'Reply within 24h' },
];

const BENEFITS = [
  {
    title: 'Vetted, every one',
    copy: 'We verify license status, identity, and a clean compliance record before any agent shows on the platform.',
  },
  {
    title: 'Local expertise',
    copy: 'Filter by metro and specialty — luxury, new construction, multi-family, commercial — and find the right person.',
  },
  {
    title: 'Direct contact',
    copy: 'Chat, call, WhatsApp or email. No phone trees, no spam — your details stay between you and the agent.',
  },
];

export default function AgentsPage() {
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
        <div className={styles.bloomB} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Find an agent
        </p>
        <h1 className={styles.title}>
          The right <em>agent</em>, in your market.
        </h1>
        <p className={styles.lede}>
          Browse verified OSK agents by city and specialty — or post your needs and we’ll
          match you to two or three people worth talking to.
        </p>
      </header>

      <div className={styles.body}>
        <dl className={styles.stats}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.statValue}>{stat.value}</dt>
              <dd className={styles.statLabel}>{stat.label}</dd>
            </div>
          ))}
        </dl>

        <section className={styles.section}>
          <span className={styles.sectionEyebrow}>Verified roster</span>
          <h2 className={styles.sectionTitle}>Browse our agents</h2>
          <AgentsDirectory />
        </section>

        <section className={styles.section}>
          <span className={styles.sectionEyebrow}>What we offer</span>
          <h2 className={styles.sectionTitle}>Why OSK agents</h2>
          <div className={styles.cards}>
            {BENEFITS.map((b) => (
              <div key={b.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M20 7L9 18l-5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className={styles.cardTitle}>{b.title}</h3>
                <p className={styles.cardCopy}>{b.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.cta}>
          <div className={styles.ctaCopy}>
            <h2 className={styles.ctaTitle}>Are you an agent?</h2>
            <p className={styles.ctaSub}>
              Join the OSK network — verified profiles, standout listings, and a steady
              stream of qualified leads.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/sign-up">
              <Button size="lg">Apply as an agent</Button>
            </Link>
            <Link href="/contact" className={styles.ctaGhost}>
              Questions? Reach us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
