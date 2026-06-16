import Link from 'next/link';
import type { SiteSettings } from '@contracts';
import { SITE_CONTACT, addressLines } from '@/lib/siteContact';
import { FETCH_TAGS, serverFetch } from '@/lib/serverApi';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import styles from './Footer.module.scss';

/**
 * Footer column groups. `Company → About` uses the active brand name
 * at render time so it reads "About YourBrand" instead of staying on
 * a hardcoded "About OSK" after a rename.
 */
function buildColumns(companyName: string) {
  return [
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
        { href: '/about', label: `About ${companyName}` },
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
}

/**
 * Footer pulls company name, logo and contact details from the live
 * /settings endpoint so admins can change them without a redeploy. Falls
 * back to the static SITE_CONTACT constants if the backend is unreachable.
 */
export async function Footer() {
  const settings = await serverFetch<SiteSettings>('/settings', 60, [
    FETCH_TAGS.siteSettings,
  ]);

  const companyName = settings?.companyName?.trim() || SITE_CONTACT.companyName;
  const logoUrl = settings?.logoUrl ?? '';
  const email = (settings?.contact.email ?? SITE_CONTACT.email).trim();
  const phoneTel = (settings?.contact.phoneTel ?? SITE_CONTACT.phone.tel).trim();
  const phoneDisplay = (
    settings?.contact.phoneDisplay ?? SITE_CONTACT.phone.display
  ).trim();

  /* Build address lines from whatever non-empty fields exist. A
   * partially-configured site (just city + country, say) renders
   * exactly what was filled in — no placeholders, no blank rows. */
  const lines = settings
    ? [
        settings.contact.addressLine1,
        [settings.contact.addressCity, settings.contact.addressRegion]
          .filter((s) => s && s.trim())
          .join(', '),
        [settings.contact.addressPostalCode, settings.contact.addressCountry]
          .filter((s) => s && s.trim())
          .join(' '),
      ].filter((s) => s.trim().length > 0)
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
            {phoneDisplay ? (
              <a className={styles.contactLink} href={`tel:${phoneTel || phoneDisplay}`}>
                {phoneDisplay}
              </a>
            ) : null}
            {email ? (
              <a className={styles.contactLink} href={`mailto:${email}`}>
                {email}
              </a>
            ) : null}
          </address>
        </div>

        {buildColumns(companyName).map((col) => (
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
