import type { Metadata } from 'next';
import type { SiteSettings } from '@contracts';
import { ContactForm } from './ContactForm';
import { SITE_CONTACT, addressLines } from '@/lib/siteContact';
import { serverFetch } from '@/lib/serverApi';
import styles from '../_marketing.module.scss';
import contactStyles from './contact.module.scss';

export const metadata: Metadata = {
  title: 'Contact OSK',
  description: 'Get in touch with the OSK team — sales, support, press.',
};

export default async function ContactPage() {
  const settings = await serverFetch<SiteSettings>('/settings', 60);
  const email = settings?.contact.email ?? SITE_CONTACT.email;
  const phoneTel = settings?.contact.phoneTel ?? SITE_CONTACT.phone.tel;
  const phoneDisplay = settings?.contact.phoneDisplay ?? SITE_CONTACT.phone.display;
  const lines = settings
    ? [
        settings.contact.addressLine1,
        `${settings.contact.addressCity}, ${settings.contact.addressRegion} ${settings.contact.addressPostalCode}`,
        settings.contact.addressCountry,
      ]
    : addressLines();
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
        <div className={styles.bloomB} />
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Contact
        </p>
        <h1 className={styles.title}>
          Talk to <em>a person.</em>
        </h1>
        <p className={styles.lede}>
          Sales, support, press, partnerships — drop us a note and we’ll route
          your message to the right team within one business day.
        </p>
      </header>

      <div className={contactStyles.layout}>
        <div className={contactStyles.formCol}>
          <ContactForm />
        </div>

        <aside className={contactStyles.detailsCol}>
          <div className={contactStyles.card}>
            <h2 className={contactStyles.cardTitle}>Visit us</h2>
            <address className={contactStyles.address}>
              {lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </div>

          <div className={contactStyles.card}>
            <h2 className={contactStyles.cardTitle}>Call us</h2>
            <a className={contactStyles.cardLink} href={`tel:${phoneTel}`}>
              {phoneDisplay}
            </a>
            <p className={contactStyles.cardHint}>
              Mon–Fri, 9 am – 6 pm ET. Press &amp; partnerships at extension 2.
            </p>
          </div>

          <div className={contactStyles.card}>
            <h2 className={contactStyles.cardTitle}>Email us</h2>
            <a className={contactStyles.cardLink} href={`mailto:${email}`}>
              {email}
            </a>
            <p className={contactStyles.cardHint}>
              Replies within one business day. For listing-specific questions,
              message the agent directly from the property page.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
