'use client';

import Link from 'next/link';
import { useGetMySubscriptionQuery } from '@/features/subscriptions';
import styles from './SubscriptionGate.module.scss';

/**
 * Renders a friendly nudge card when the seller has no active
 * subscription. Used at the top of the New Listing form. Returns null
 * while loading or when the user is already on an active plan, so the
 * form is responsible for showing the banner conditionally.
 *
 * Backend will return 403 on submit even if the user bypasses this UI,
 * so this is purely a guardrail — not the gate itself.
 */
export function SubscriptionGate() {
  const { data: subscription, isLoading } = useGetMySubscriptionQuery();

  if (isLoading) return null;
  /* Anything but a healthy active sub triggers the nudge — including
   * pending-payment, cancelled and expired, since none of those let
   * the seller publish a fresh listing. */
  if (subscription && subscription.status === 'active') return null;

  const statusCopy = !subscription
    ? "You don't have an active plan yet."
    : subscription.status === 'pending-payment'
      ? 'Your subscription is awaiting payment.'
      : subscription.status === 'cancelled'
        ? 'Your subscription was cancelled.'
        : 'Your subscription has expired.';

  return (
    <aside className={styles.card} role="status">
      <div className={styles.copy}>
        <h2 className={styles.title}>Pick a plan to publish.</h2>
        <p className={styles.sub}>
          {statusCopy} To submit a new listing for review, choose a plan that fits how you
          sell.
        </p>
      </div>
      <Link href="/pricing" className={styles.cta}>
        See pricing →
      </Link>
    </aside>
  );
}
