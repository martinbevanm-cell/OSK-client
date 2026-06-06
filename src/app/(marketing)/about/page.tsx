import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'About OSK',
  description: 'Real estate, curated. The story, values, and people behind OSK.',
};

const VALUES = [
  {
    title: 'Curated, not crowded',
    copy: 'Every listing is reviewed by a person before it goes live. We keep the catalog tight so what you find is worth your time.',
  },
  {
    title: 'Direct lines',
    copy: 'No spam middlemen. You talk to owners and verified agents by chat, call, WhatsApp or email — your call.',
  },
  {
    title: 'Privacy first',
    copy: 'Your details stay with the listing owner. Numbers are masked, emails are relayed, consent is logged.',
  },
];

const STATS = [
  { value: '12,400+', label: 'Curated listings' },
  { value: '850+', label: 'Verified agents' },
  { value: '40+', label: 'U.S. markets' },
  { value: '$4.2B', label: 'Closed last year' },
];

export default function AboutPage() {
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
        <div className={styles.bloomB} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          About OSK
        </p>
        <h1 className={styles.title}>
          A better way to <em>find a home.</em>
        </h1>
        <p className={styles.lede}>
          OSK is a curated real-estate platform for the U.S. We bring together owners,
          verified agents and serious buyers — and we keep the experience quiet, honest,
          and direct.
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
          <span className={styles.sectionEyebrow}>What we believe</span>
          <h2 className={styles.sectionTitle}>Three things shape every page</h2>
          <div className={styles.cards}>
            {VALUES.map((value) => (
              <div key={value.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="18" height="18">
                    <path
                      d="M3 8.5l3 3 7-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className={styles.cardTitle}>{value.title}</h3>
                <p className={styles.cardCopy}>{value.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.cta}>
          <div className={styles.ctaCopy}>
            <h2 className={styles.ctaTitle}>List a property with OSK</h2>
            <p className={styles.ctaSub}>
              Reach serious buyers — and stay in control of how people contact you.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/sell">
              <Button size="lg">Start a listing</Button>
            </Link>
            <Link href="/contact" className={styles.ctaGhost}>
              Talk to us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
