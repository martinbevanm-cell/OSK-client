import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from './SellerCta.module.scss';

/** Final pitch for sellers / agents. Server component. */
export function SellerCta() {
  return (
    <section className={styles.section} aria-labelledby="seller-heading">
      <div className={styles.card}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            For owners &amp; agents
          </span>
          <h2 id="seller-heading" className={styles.title}>
            List your property <em>with OSK.</em>
          </h2>
          <p className={styles.sub}>
            Reach serious buyers with a standout listing — and stay in control of how
            people contact you. No listing fees up to your first sale.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/sell">
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
