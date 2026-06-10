import styles from './WhyOsk.module.scss';

const VALUES = [
  {
    title: 'Curated, not crowded',
    copy: 'Every listing is reviewed by a person before it goes live. We keep the catalog tight so what you find is worth your time.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 2l2.5 7H22l-6 4.5L18 22l-6-4.5L6 22l2-8.5L2 9h7.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Verified agents',
    copy: 'License status, identity, and a clean compliance record — every agent on OSK is checked before they ever talk to a buyer.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 1l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Direct lines',
    copy: 'Chat, call, WhatsApp, email — your call. Numbers are masked, emails are relayed, and no spam middleman sits in between.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Privacy first',
    copy: 'Your details stay between you and the owner. We never sell personal data, and consent is logged for every channel you opt into.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <rect
          x="4"
          y="11"
          width="16"
          height="10"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M8 11V7a4 4 0 1 1 8 0v4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

/** "Why OSK" value props. Server component. */
export function WhyOsk() {
  return (
    <section className={styles.section} aria-labelledby="why-heading">
      <header className={styles.head}>
        <span className={styles.eyebrow}>Why OSK</span>
        <h2 id="why-heading" className={styles.title}>
          A quieter, more <em>honest</em> way to buy.
        </h2>
        <p className={styles.sub}>
          We built OSK to be the platform we&rsquo;d want to use ourselves — curated,
          direct, and respectful of your time.
        </p>
      </header>

      <ul className={styles.grid}>
        {VALUES.map((v) => (
          <li key={v.title} className={styles.card}>
            <span className={styles.iconWrap} aria-hidden="true">
              {v.icon}
            </span>
            <h3 className={styles.cardTitle}>{v.title}</h3>
            <p className={styles.cardCopy}>{v.copy}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
