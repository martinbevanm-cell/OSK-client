import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SiteSettings } from '@contracts';
import { serverFetch } from '@/lib/serverApi';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms under which OSK provides the platform.',
};

const FALLBACK_TERMS = `## 1. Acceptance

By accessing or using OSK, you agree to be bound by these Terms. If you don't agree, please don't use the service.

## 2. Eligibility

You must be at least 18 years old and able to enter into a binding contract to create an account. By signing up, you confirm that the information you provide is accurate and complete.

## 3. Listings

You may only list properties you own or are authorized to represent. All listings must be accurate and comply with applicable law. We reserve the right to review, edit, or remove listings that don't meet our standards.

## 4. User conduct

You agree not to misuse the platform — including spamming other users, scraping content, impersonating others, or interfering with the security or operation of the service.

## 5. Content & intellectual property

You retain ownership of the content you upload. By uploading, you grant OSK a non-exclusive, worldwide license to display and distribute that content on the platform.

## 6. Disclaimers

OSK provides the platform "as is" and makes no warranties about listing accuracy. We are not a party to any transaction between buyers and sellers and do not provide legal, financial, or tax advice.

## 7. Limitation of liability

To the maximum extent permitted by law, OSK and its affiliates are not liable for any indirect, incidental, or consequential damages arising out of your use of the service.

## 8. Termination

We may suspend or terminate your account if you violate these Terms or applicable law. You may delete your account at any time.

## 9. Changes

We may update these Terms from time to time. Material changes will be communicated via email or in-app notice.

## 10. Contact

Questions? Reach our team through the contact form or at legal@osk.dev.`;

function formatDate(value?: string): string {
  if (!value?.trim()) return 'January 1, 2026';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function TermsPage() {
  const settings = await serverFetch<SiteSettings>('/settings', 0);
  const markdown = settings?.legal?.termsMarkdown?.trim() || FALLBACK_TERMS;
  const effectiveDate = formatDate(settings?.legal?.termsUpdatedAt);

  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Terms
        </p>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lede}>
          These terms govern your use of the OSK platform. Please read them carefully.
          Effective date: {effectiveDate}.
        </p>
      </header>

      <article className={styles.prose}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </section>
  );
}
