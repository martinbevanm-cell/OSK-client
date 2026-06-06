'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AdminReview } from '@contracts';
import { useDeleteAdminReviewMutation, useListAdminReviewsQuery } from '@/features/admin';
import { useAppDispatch } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import styles from './ReviewsModeration.module.scss';

function stars(rating: number): string {
  const full = '★'.repeat(Math.max(0, Math.min(5, Math.round(rating))));
  const empty = '☆'.repeat(5 - full.length);
  return `${full}${empty}`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function ReviewsModeration() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useListAdminReviewsQuery({
    page,
    limit: 20,
  });
  const [deleteReview, { isLoading: deleting }] = useDeleteAdminReviewMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  const onDelete = async (review: AdminReview) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Delete this review by ${review.authorName}?`)
    ) {
      return;
    }
    setBusyId(review.id);
    try {
      await deleteReview(review.id).unwrap();
      dispatch(toastPushed('success', 'Review removed.'));
    } catch {
      /* surfaced by the global toast */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Reviews</span>
        <h1 className={styles.title}>Reviews</h1>
        <p className={styles.sub}>
          Reviews publish immediately. Remove spam, harassment, or anything that names a
          private individual.
        </p>
      </header>

      {isLoading ? (
        <p className={styles.muted}>Loading reviews…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load reviews.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>No reviews yet.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((r) => (
            <li key={r.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemStars} aria-label={`${r.rating} of 5 stars`}>
                  {stars(r.rating)}
                </span>
                <span className={styles.itemDate}>{formatDate(r.createdAt)}</span>
              </div>

              {r.title ? <p className={styles.itemTitle}>{r.title}</p> : null}
              <p className={styles.itemBody}>{r.body}</p>

              <div className={styles.itemFoot}>
                <div className={styles.author}>
                  <p className={styles.authorName}>{r.authorName}</p>
                  <p className={styles.authorEmail}>{r.authorEmail}</p>
                </div>
                <Link
                  href={`/property/${r.propertyId}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.viewProperty}
                >
                  View listing →
                </Link>
                <button
                  type="button"
                  className={styles.delete}
                  disabled={deleting || busyId === r.id}
                  onClick={() => onDelete(r)}
                >
                  {busyId === r.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!canPrev}
            onClick={() => setPage((n) => Math.max(1, n - 1))}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.pages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!canNext}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
