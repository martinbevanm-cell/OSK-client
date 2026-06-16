import type { Metadata } from 'next';
import Link from 'next/link';
import type { SiteSettings } from '@contracts';
import { Button } from '@/components/ui';
import { FETCH_TAGS, serverFetch } from '@/lib/serverApi';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'About',
  description: 'The story, values, and people behind the platform.',
};

/* Generic fallback stats — only used when the admin hasn't filled
 *  in the four homeStats slots under /admin/settings. */
const FALLBACK_STATS = [
  { value: '—', label: 'Curated listings' },
  { value: '—', label: 'Verified agents' },
  { value: '—', label: 'Active markets' },
  { value: '—', label: 'Closed last year' },
];

/* Default copy for the About page when the deployed backend's settings
 * doc has no `about` field yet (e.g. the singleton was created before
 * the field was added). Mirrors DEFAULT_ABOUT on the backend so the
 * page never shows up empty regardless of DB state. */
const DEFAULT_VALUES = [
  {
    title: 'Curated, not crowded',
    body: 'Every listing is reviewed by a person before it goes live. We keep the catalog tight so what you find is worth your time.',
  },
  {
    title: 'Direct lines',
    body: 'No spam middlemen. You talk to owners and verified agents by chat, call, WhatsApp or email — your call.',
  },
  {
    title: 'Privacy first',
    body: 'Your details stay with the listing owner. Numbers are masked, emails are relayed, consent is logged.',
  },
];

const DEFAULT_PROCESS = [
  {
    title: 'Browse curated inventory',
    body: 'Filter by price, neighborhood, or amenities — every listing is hand-reviewed before it appears.',
  },
  {
    title: 'Connect directly',
    body: 'Reach the owner or agent on the channel you prefer: chat, call, WhatsApp, or email relay.',
  },
  {
    title: 'Schedule on your terms',
    body: 'Book a viewing time that works for you — no back-and-forth, no pressure.',
  },
  {
    title: 'Close with confidence',
    body: 'Move forward with verified counterparties and a clear paper trail from first contact to handover.',
  },
];

export default async function AboutPage() {
  const settings = await serverFetch<SiteSettings>('/settings', 60, [
    FETCH_TAGS.siteSettings,
  ]);
  const companyName = settings?.companyName?.trim() || 'us';
  const stats =
    settings?.homeStats && settings.homeStats.length === 4
      ? settings.homeStats
      : FALLBACK_STATS;
  const about = settings?.about;

  /* Every section is editable from /admin/settings. We fall back to a
   * sensible default string if a particular field is empty so a brand-new
   * install still renders cleanly. The `{companyName}` token is supported
   * in the eyebrow + CTA copy so the admin can leave them generic and
   * still get a personalised page. */
  const eyebrow = sub(about?.header?.eyebrow, `About ${companyName}`, companyName);
  const titlePrefix = about?.header?.titlePrefix?.trim() || 'A better way to';
  const titleEmphasis = about?.header?.titleEmphasis?.trim() || 'find a home.';
  const lede = sub(
    about?.header?.lede,
    `${companyName} is a curated real-estate platform. We bring together owners, verified agents and serious buyers — and we keep the experience quiet, honest, and direct.`,
    companyName,
  );

  const valuesEyebrow = about?.values?.eyebrow?.trim() || 'What we believe';
  const valuesTitle = about?.values?.title?.trim() || 'Three things shape every page';
  /* Fall back to the bundled defaults so the section is always visible —
   * an admin who clears every item still gets a populated page, and a
   * deployment with a pre-existing settings doc (missing the `about`
   * field) renders correctly on first request without waiting for a
   * save. */
  const valueItems =
    about?.values?.items && about.values.items.length > 0
      ? about.values.items
      : DEFAULT_VALUES;

  const processEyebrow = about?.process?.eyebrow?.trim() || 'How it works';
  const processTitle =
    about?.process?.title?.trim() || 'Four quiet steps from search to move-in';
  const processItems =
    about?.process?.items && about.process.items.length > 0
      ? about.process.items
      : DEFAULT_PROCESS;

  const ctaTitle = sub(
    about?.cta?.title,
    `List a property with ${companyName}`,
    companyName,
  );
  const ctaBody =
    about?.cta?.body?.trim() ||
    'Reach serious buyers — and stay in control of how people contact you.';

  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
        <div className={styles.bloomB} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className={styles.title}>
          {titlePrefix} <em>{titleEmphasis}</em>
        </h1>
        <p className={styles.lede}>{lede}</p>
      </header>

      <div className={styles.body}>
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.statValue}>{stat.value}</dt>
              <dd className={styles.statLabel}>{stat.label}</dd>
            </div>
          ))}
        </dl>

        {valueItems.length > 0 ? (
          <section className={styles.section}>
            <span className={styles.sectionEyebrow}>{valuesEyebrow}</span>
            <h2 className={styles.sectionTitle}>{valuesTitle}</h2>
            <div className={styles.cards}>
              {valueItems.map((value) => (
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
                  <p className={styles.cardCopy}>{value.body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ─── New section: How it works (process steps) ──────────────── */}
        {processItems.length > 0 ? (
          <section className={styles.section}>
            <span className={styles.sectionEyebrow}>{processEyebrow}</span>
            <h2 className={styles.sectionTitle}>{processTitle}</h2>
            <div className={styles.steps}>
              {processItems.map((step, i) => (
                <div key={step.title || i} className={styles.card}>
                  <span className={styles.stepBadge} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className={styles.cardTitle}>{step.title}</h3>
                  <p className={styles.cardCopy}>{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className={styles.cta}>
          <div className={styles.ctaCopy}>
            <h2 className={styles.ctaTitle}>{ctaTitle}</h2>
            <p className={styles.ctaSub}>{ctaBody}</p>
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

/** Replace `{companyName}` tokens in admin-edited copy and trim. If the
 *  field is empty, fall back to the default. */
function sub(raw: string | undefined, fallback: string, companyName: string): string {
  const value = (raw ?? '').trim();
  return (value || fallback).replace(/\{companyName\}/g, companyName);
}
