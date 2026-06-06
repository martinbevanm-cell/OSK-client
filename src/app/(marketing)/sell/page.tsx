import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Sell or List Your Property',
  description: 'List your home, plot or commercial space with OSK.',
};

const STEPS = [
  {
    title: 'Create your listing',
    copy: 'Add photos, details and pricing in minutes. Save drafts as you go.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 5v14M5 12h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'We review & publish',
    copy: 'Our team verifies and approves your listing before it goes live.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M20 7L9 18l-5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Connect with buyers',
    copy: 'Receive inquiries by chat, call, WhatsApp and email — your way.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const FEATURES = [
  'No listing fees up to your first sale',
  'Real-time inquiry notifications via email + push',
  'Owner-controlled contact channels per listing',
  'Enhanced gallery + map placement, included',
  'Lead funnel + response metrics in the dashboard',
  'Spam protection, phone masking, CAPTCHA built-in',
];

export default function SellPage() {
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
        <div className={styles.bloomB} />
      </div>

      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          For owners &amp; agents
        </p>
        <h1 className={styles.title}>
          List your property <em>with OSK.</em>
        </h1>
        <p className={styles.sub}>
          Reach serious buyers with a standout listing — and stay in control of how people
          contact you.
        </p>
        <div className={styles.headActions}>
          <Link href="/dashboard/listings/new">
            <Button size="lg">Start a listing</Button>
          </Link>
          <Link href="/contact" className={styles.ghost}>
            Talk to sales →
          </Link>
        </div>
      </header>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>{index + 1}</span>
              <span className={styles.stepIcon} aria-hidden="true">
                {step.icon}
              </span>
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepCopy}>{step.copy}</p>
          </li>
        ))}
      </ol>

      <section className={styles.features}>
        <div className={styles.featuresHead}>
          <span className={styles.sectionEyebrow}>What you get</span>
          <h2 className={styles.sectionTitle}>Everything you need to sell</h2>
        </div>
        <ul className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <li key={feature} className={styles.feature}>
              <span className={styles.featureCheck} aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path
                    d="M3.5 8.5l3 3 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.cta}>
        <div className={styles.ctaCopy}>
          <h2 className={styles.ctaTitle}>Ready when you are.</h2>
          <p className={styles.ctaSub}>
            Drafts are saved automatically. You can publish whenever your listing is
            ready.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <Link href="/dashboard/listings/new">
            <Button size="lg">Start a listing</Button>
          </Link>
          <Link href="/agents" className={styles.ghost}>
            Work with an agent →
          </Link>
        </div>
      </div>
    </section>
  );
}
