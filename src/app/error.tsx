'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from './error.module.scss';

/**
 * App-level error boundary. Next.js renders this for any uncaught error
 * thrown by a page or layout. Sentry-compatible hook in here later.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production: route to Sentry / your tracer. Dev: log to console.
    if (process.env.NODE_ENV !== 'production') {
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <section className={styles.page} role="alert" aria-live="assertive">
      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Something went wrong
        </p>
        <h1 className={styles.title}>
          We hit an <em>unexpected</em> error.
        </h1>
        <p className={styles.sub}>
          Our team has been notified. You can try again, or head back home.
        </p>

        {error.digest ? (
          <p className={styles.digest}>
            Reference&nbsp;<code>{error.digest}</code>
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/" className={styles.ghost}>
            Back to home →
          </Link>
        </div>
      </div>
    </section>
  );
}
