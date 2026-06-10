import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from './not-found.module.scss';

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bloomA} />
        <div className={styles.bloomB} />
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Error 404
        </p>
        <h1 className={styles.title}>
          This <em>listing</em> couldn’t be found.
        </h1>
        <p className={styles.sub}>
          The page you’re looking for may have been moved, sold, or never existed. Head
          back to the home page or browse listings instead.
        </p>

        <div className={styles.actions}>
          <Link href="/">
            <Button size="lg">Back to home</Button>
          </Link>
          <Link href="/buy" className={styles.ghost}>
            Browse homes →
          </Link>
        </div>
      </div>
    </section>
  );
}
