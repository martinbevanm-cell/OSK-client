import type { SiteSettings } from '@contracts';
import { FETCH_TAGS, serverFetch } from '@/lib/serverApi';
import styles from './TrustedPartners.module.scss';

/* Fallback content — used only when the deployed backend's settings
 *  doc has no `partners` field yet (i.e. an upgraded install where
 *  the singleton predates this field). Mirrors DEFAULT_PARTNERS on
 *  the backend so the page never renders empty. */
const FALLBACK_PARTNERS = {
  eyebrow: 'Trusted partners',
  title: 'A network you can close with.',
  sub: 'From financing to the final inspection, OSK works with vetted local pros so every step of the move stays under one roof.',
  items: [
    { name: 'Atlas Mortgage', role: 'Mortgage broker' },
    { name: 'Liberty Title', role: 'Title insurance' },
    { name: 'Apex Inspections', role: 'Home inspection' },
    { name: 'First Federal Bank', role: 'Lender' },
    { name: 'Sterling Insure', role: 'Home insurance' },
    { name: 'Cornerstone Movers', role: 'Relocation' },
  ],
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/** Quiet logo strip — partner cards (initials avatar + name + role).
 *  Server component; reads the partners block from /settings.
 *  Editable from /admin/settings → Home tab. */
export async function TrustedPartners() {
  const settings = await serverFetch<SiteSettings>('/settings', 60, [
    FETCH_TAGS.siteSettings,
  ]);
  const eyebrow = settings?.partners?.eyebrow?.trim() || FALLBACK_PARTNERS.eyebrow;
  const title = settings?.partners?.title?.trim() || FALLBACK_PARTNERS.title;
  const sub = settings?.partners?.sub?.trim() || FALLBACK_PARTNERS.sub;
  const items =
    settings?.partners?.items && settings.partners.items.length > 0
      ? settings.partners.items
      : FALLBACK_PARTNERS.items;

  return (
    <section className={styles.section} aria-labelledby="partners-heading">
      <div className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {eyebrow}
          </span>
          <h2 id="partners-heading" className={styles.title}>
            {title}
          </h2>
          <p className={styles.sub}>{sub}</p>
        </header>

        <ul className={styles.grid} role="list">
          {items.map((partner) => (
            <li key={`${partner.name}-${partner.role}`} className={styles.tile}>
              <span className={styles.logo} aria-hidden="true">
                {initialsOf(partner.name)}
              </span>
              <div className={styles.text}>
                <h3 className={styles.partnerName}>{partner.name}</h3>
                <p className={styles.partnerRole}>{partner.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
