import Link from 'next/link';
import type { SiteSettings } from '@contracts';
import { SITE_CONTACT, addressLines } from '@/lib/siteContact';
import { serverFetch } from '@/lib/serverApi';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import styles from './Footer.module.scss';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/buy', label: 'Buy' },
      { href: '/rent', label: 'Rent' },
      { href: '/new-projects', label: 'New Projects' },
      { href: '/commercial', label: 'Commercial' },
      { href: '/plots', label: 'Plots & Land' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About OSK' },
      { href: '/agents', label: 'Find an Agent' },
      { href: '/saved', label: 'Saved Listings' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

/**
 * Footer pulls company name, logo and contact details from the live
 * /settings endpoint so admins can change them without a redeploy. Falls
 * back to the static SITE_CONTACT constants if the backend is unreachable.
 */
export async function Footer() {
  const settings = await serverFetch<SiteSettings>('/settings', 60);

  const companyName = settings?.companyName ?? SITE_CONTACT.companyName;
  const logoUrl = settings?.logoUrl ?? '';
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
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(logoUrl)}
              alt={companyName}
              className={styles.logo}
            />
          ) : (
            <span className={styles.brand}>{companyName}</span>
          )}
          <p className={styles.tagline}>Homes, land and commercial space — curated.</p>
          <address className={styles.contact}>
            {lines.map((line) => (
              <span key={line} className={styles.contactLine}>
                {line}
              </span>
            ))}
            <a className={styles.contactLink} href={`tel:${phoneTel}`}>
              {phoneDisplay}
            </a>
            <a className={styles.contactLink} href={`mailto:${email}`}>
              {email}
            </a>
          </address>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} className={styles.col} aria-label={col.title}>
            <h4 className={styles.colTitle}>{col.title}</h4>
            {col.links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>

      <div className={styles.bar}>
        <span>
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
