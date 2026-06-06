'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import styles from './Newsletter.module.scss';

const emailSchema = z.string().email('Please enter a valid email address.');

/**
 * Newsletter signup strip, lives above the footer site-wide.
 * Client-only; validates with Zod and acknowledges with a toast.
 * TODO(backend): POST /marketing/subscribe once the route ships.
 */
export function Newsletter() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email.');
      return;
    }
    setError(null);
    setSubmitting(true);

    // TODO(backend): POST to /marketing/subscribe once the route ships.
    await new Promise((r) => setTimeout(r, 600));

    dispatch(
      toastPushed('success', 'Subscribed — check your inbox for a welcome note.'),
    );
    setEmail('');
    setSubmitting(false);
  };

  return (
    <section className={styles.section} aria-labelledby="nl-heading">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>The OSK Brief</span>
          <h2 id="nl-heading" className={styles.title}>
            Weekly listings, curated.
          </h2>
          <p className={styles.sub}>
            One email, every Friday. New listings, market notes and a
            hand-picked home of the week — straight to your inbox. No spam,
            unsubscribe anytime.
          </p>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email address</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              aria-invalid={error ? true : undefined}
              required
            />
          </label>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Sending…' : 'Subscribe'}
          </Button>
          {error ? (
            <span className={styles.error} role="alert">
              {error}
            </span>
          ) : (
            <span className={styles.hint}>
              By subscribing you agree to our{' '}
              <a href="/privacy">privacy policy</a>.
            </span>
          )}
        </form>
      </div>
    </section>
  );
}
