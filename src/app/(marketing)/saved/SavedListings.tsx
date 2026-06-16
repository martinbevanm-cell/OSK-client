'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui';
import { selectSavedItems, clearSaved } from '@/features/saved';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import styles from './SavedListings.module.scss';

export function SavedListings() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectSavedItems);

  /* The saved-list lives in localStorage and is hydrated into the
   * Redux store synchronously on client boot. That means the server
   * render shows zero items while the very first client render
   * already has the persisted ones — a classic React hydration
   * mismatch (error 418 in prod). We gate the render on a mount
   * flag so the server and the first client paint agree (both show
   * the empty state), then the real items appear after mount. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const onClearAll = () => {
    dispatch(clearSaved());
    dispatch(toastPushed('info', 'All saved listings cleared.'));
  };

  if (!mounted || items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className={styles.emptyTitle}>No saved listings yet</p>
        <p className={styles.emptyMsg}>
          Tap the heart on any property to save it here. Compare, revisit, and share
          whenever you’re ready.
        </p>
        <div className={styles.emptyActions}>
          <Link href="/buy">
            <Button size="lg">Browse homes</Button>
          </Link>
          <Link href="/rent" className={styles.emptyGhost}>
            Look at rentals →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {items.length} {items.length === 1 ? 'listing' : 'listings'}
        </span>
        <button type="button" className={styles.clear} onClick={onClearAll}>
          Clear all
        </button>
      </div>

      <div className={styles.grid}>
        {items.map((property, index) => (
          <PropertyCard key={property.id} property={property} priority={index < 3} />
        ))}
      </div>
    </>
  );
}
