'use client';

import Link from 'next/link';
import { useGetPropertyQuery } from '@/features/properties';
import { NewListingForm } from './NewListingForm';
import styles from './NewListingForm.module.scss';

/**
 * Edit-mode wrapper around NewListingForm. Loads the property by slug and
 * pre-fills the shared form. Backend re-checks owner authorization on PATCH,
 * so the public getProperty endpoint is safe to use here.
 */
export function EditListing({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useGetPropertyQuery(slug);

  if (isLoading) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Edit listing</span>
          <h1 className={styles.title}>Loading…</h1>
        </header>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Edit listing</span>
          <h1 className={styles.title}>Listing not found</h1>
          <p className={styles.sub}>
            The listing you’re trying to edit doesn’t exist, or you don’t have
            permission to manage it.
          </p>
          <Link href="/dashboard/listings" className={styles.back}>
            ← Back to listings
          </Link>
        </header>
      </section>
    );
  }

  return <NewListingForm initialProperty={data} />;
}
