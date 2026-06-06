'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createReviewSchema, type CreateReviewDto } from '@contracts';
import { selectCurrentUser } from '@/features/auth';
import { toastPushed } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  useCreateReviewMutation,
  useListPropertyReviewsQuery,
} from '../reviewsApi';
import styles from './PropertyReviews.module.scss';

interface PropertyReviewsProps {
  propertyId: string;
}

/**
 * Reviews section for the property detail page. Shows the running average,
 * the reviews themselves, and (for authed users) a write-a-review form.
 */
export function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading } = useListPropertyReviewsQuery(propertyId);

  const reviews = data?.items ?? [];
  const total = reviews.length;
  const avg =
    total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;
  const userHasReviewed = !!user && reviews.some((r) => r.authorId === user.id);

  return (
    <div className={styles.shell}>
      <header className={styles.summary}>
        <div className={styles.summaryMain}>
          {total > 0 ? (
            <>
              <p className={styles.summaryScore}>
                <span className={styles.summaryNumber}>{avg.toFixed(1)}</span>
                <span className={styles.summaryStars} aria-hidden="true">
                  <Stars value={avg} />
                </span>
              </p>
              <p className={styles.summaryMeta}>
                Based on {total} {total === 1 ? 'review' : 'reviews'}
              </p>
            </>
          ) : (
            <p className={styles.summaryMeta}>No reviews yet.</p>
          )}
        </div>
      </header>

      {isLoading ? (
        <p className={styles.muted}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className={styles.muted}>
          Be the first to share your thoughts on this property.
        </p>
      ) : (
        <ul className={styles.list}>
          {reviews.map((r) => (
            <li key={r.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemStars} aria-label={`${r.rating} of 5`}>
                  <Stars value={r.rating} />
                </span>
                <span className={styles.itemDate}>
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {r.title ? <p className={styles.itemTitle}>{r.title}</p> : null}
              <p className={styles.itemBody}>{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        userHasReviewed ? (
          <p className={styles.notice}>You&rsquo;ve already reviewed this property.</p>
        ) : (
          <WriteReviewForm propertyId={propertyId} />
        )
      ) : (
        <p className={styles.notice}>
          <Link href="/sign-in" className={styles.noticeLink}>
            Sign in
          </Link>{' '}
          to leave a review.
        </p>
      )}
    </div>
  );
}

/* ─── star renderer ─────────────────────────────────────────────────── */
function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn(styles.star, i < rounded && styles.starOn)}>
          ★
        </span>
      ))}
    </>
  );
}

/* ─── form ───────────────────────────────────────────────────────────── */
function WriteReviewForm({ propertyId }: { propertyId: string }) {
  const dispatch = useAppDispatch();
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [rating, setRating] = useState<number>(5);
  const [hover, setHover] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const payload: CreateReviewDto = {
      propertyId,
      rating,
      title: title.trim() || undefined,
      body: body.trim(),
    };
    const parsed = createReviewSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please review the form.');
      return;
    }
    try {
      await createReview(parsed.data).unwrap();
      dispatch(toastPushed('success', 'Thanks — your review is live.'));
      setTitle('');
      setBody('');
      setRating(5);
    } catch {
      setError('Couldn’t save your review. Try again in a moment.');
    }
  };

  const active = hover ?? rating;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={styles.formTitle}>Write a review</p>
      <div className={styles.ratingPicker} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            className={cn(styles.ratingStar, n <= active && styles.ratingStarOn)}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
      </div>
      <TextField
        label="Headline (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />
      <label className={styles.field}>
        <span className={styles.label}>Your review</span>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="What stood out about the property? Be specific and honest — at least 10 characters."
          maxLength={2000}
        />
      </label>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Posting…' : 'Post review'}
      </Button>
    </form>
  );
}
