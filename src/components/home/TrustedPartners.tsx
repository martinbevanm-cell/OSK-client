import styles from './TrustedPartners.module.scss';

/* Static list — admin-editable partners can come later via SiteSettings.
 * Names are generic placeholders so we never claim a real partnership
 * we don't have. Each entry pairs a short label (used to build the
 * initials avatar) with the partner's role on the deal. */
interface Partner {
  name: string;
  role: string;
}

const PARTNERS: Partner[] = [
  { name: 'Atlas Mortgage', role: 'Mortgage broker' },
  { name: 'Liberty Title', role: 'Title insurance' },
  { name: 'Apex Inspections', role: 'Home inspection' },
  { name: 'First Federal Bank', role: 'Lender' },
  { name: 'Sterling Insure', role: 'Home insurance' },
  { name: 'Cornerstone Movers', role: 'Relocation' },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/** Quiet logo strip — partner cards (initials avatar + name + role). */
export function TrustedPartners() {
  return (
    <section className={styles.section} aria-labelledby="partners-heading">
      <div className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Trusted partners
          </span>
          <h2 id="partners-heading" className={styles.title}>
            A network you can close with.
          </h2>
          <p className={styles.sub}>
            From financing to the final inspection, OSK works with vetted
            local pros so every step of the move stays under one roof.
          </p>
        </header>

        <ul className={styles.grid} role="list">
          {PARTNERS.map((partner) => (
            <li key={partner.name} className={styles.tile}>
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
