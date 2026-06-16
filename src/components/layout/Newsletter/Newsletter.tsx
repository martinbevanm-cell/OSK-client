'use client';

import { useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useSubscribeNewsletterMutation } from '@/features/marketing';
import { useAppDispatch } from '@/store/hooks';
import styles from './Newsletter.module.scss';

const emailSchema = z.string().email('Please enter a valid email address.');

/**
 * Newsletter signup strip, lives above the footer site-wide.
 * Validates with Zod, POSTs to /marketing/subscribe (rate-limited),
 * shows a toast on success. The page path is sent as `source` so
 * admins can see which page each subscription came from.
 */
export function Newsletter() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [subscribe, { isLoading: submitting }] = useSubscribeNewsletterMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email.');
      return;
    }
    setError(null);

    try {
      /* `usePathname()` returns just the URL pathname — no query
       *  string, no hash — so analytics rolls up cleanly per page
       *  ("/about" not "/about?ref=foo"). Strip anything after the
       *  first '?' / '#' as a defensive belt-and-suspenders, and cap
       *  to 120 chars to match the backend column. */
      const cleanSource = (pathname ?? '').split(/[?#]/)[0]?.slice(0, 120);
      await subscribe({
        email: parsed.data,
        source: cleanSource || undefined,
      }).unwrap();
      dispatch(
        toastPushed('success', 'Subscribed — you’ll get the Friday brief in your inbox.'),
      );
      setEmail('');
    } catch {
      /* Global error toast surfaces the reason. Most common:
       * RATE_LIMITED (>10 in 10 minutes) — backend returns 429. */
    }
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
            One email, every Friday. New listings, market notes and a hand-picked home of
            the week — straight to your inbox. No spam, unsubscribe anytime.
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
              By subscribing you agree to our <a href="/privacy">privacy policy</a>.
            </span>
          )}
        </form>
      </div>
    </section>
  );
}
