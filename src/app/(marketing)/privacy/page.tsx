import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SiteSettings } from '@contracts';
import { FETCH_TAGS, serverFetch } from '@/lib/serverApi';
import styles from '../_marketing.module.scss';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How we collect, use, and protect your personal information.',
};

/* Generic fallback used only when the admin hasn't pasted a custom
 * privacy markdown yet. Contact lines reference "our contact form"
 * instead of any specific email so a fresh-install footer doesn't
 * broadcast a stale address. */
const FALLBACK_PRIVACY = `## 1. What we collect

We collect the information you give us directly — your name, email address, phone number (if you share it), the listings you save, and the inquiries you send. We also collect usage data (pages viewed, actions taken) and basic device information for security and analytics.

## 2. How we use it

Your information is used to operate the platform: to surface relevant listings, deliver your inquiries to the right owner or agent, prevent fraud and abuse, and improve our product over time. We do not sell your personal information.

## 3. Communication preferences

When you submit an inquiry, we share your contact details with the listing owner so they can respond. You can unsubscribe from marketing emails at any time using the link in any message we send.

## 4. Cookies & analytics

We use a small set of first-party cookies for sign-in, theme preference, and aggregate analytics. You can manage cookie preferences from your browser settings.

## 5. Data retention

We retain account information while your account is active and for a reasonable period afterwards as required by law. You can request deletion of your account and associated personal data at any time.

## 6. Your rights

Depending on where you live, you may have the right to access, correct, delete or export your personal information. Reach our team through the contact form to exercise these rights.

## 7. Contact

Questions about this policy? Reach our team through the contact form.`;

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

export default async function PrivacyPage() {
  const settings = await serverFetch<SiteSettings>('/settings', 60, [
    FETCH_TAGS.siteSettings,
  ]);
  const markdown = settings?.legal?.privacyMarkdown?.trim() || FALLBACK_PRIVACY;
  const effectiveDate = formatDate(settings?.legal?.privacyUpdatedAt);

  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Privacy
        </p>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lede}>
          This summary explains how {settings?.companyName ?? 'we'} collect, use, and
          protect your information. Effective date: {effectiveDate}.
        </p>
      </header>

      <article className={styles.prose}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </section>
  );
}
