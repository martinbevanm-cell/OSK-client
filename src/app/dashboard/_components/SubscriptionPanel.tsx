'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { Subscription, SubscriptionPlan } from '@contracts';
import {
  useCancelSubscriptionMutation,
  useGetMySubscriptionQuery,
  useListSubscriptionPlansQuery,
} from '@/features/subscriptions';
import { selectActiveCountry } from '@/features/geo';
import { toastPushed } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { currencyForCountry } from '@/lib/geoData';
import { convertAmount } from '@/lib/fx';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './SubscriptionPanel.module.scss';

/* ─────────────────────────────────────────────────────────────────────────
 * Dashboard subscription page.
 *
 *  - Active plan card (name, status, period end, features summary)
 *  - "Upgrade / Change plan" → routes to /pricing
 *  - "Cancel" button when active and not already cancelled
 *
 * No plan → friendly empty state pointing the user at /pricing.
 * ──────────────────────────────────────────────────────────────────────── */

export function SubscriptionPanel() {
  const dispatch = useAppDispatch();
  const { data: subscription, isLoading } = useGetMySubscriptionQuery();
  const { data: plans } = useListSubscriptionPlansQuery();
  const [cancel, { isLoading: cancelling }] = useCancelSubscriptionMutation();
  const activeCountry = useAppSelector(selectActiveCountry);
  const localCurrency = useMemo(() => currencyForCountry(activeCountry), [activeCountry]);

  const plan = useMemo<SubscriptionPlan | undefined>(() => {
    if (!subscription || !plans) return undefined;
    return plans.find((p) => p.id === subscription.planId);
  }, [subscription, plans]);

  const onCancel = async () => {
    if (!confirm('Cancel your subscription? You keep access until the period ends.')) {
      return;
    }
    try {
      await cancel().unwrap();
      dispatch(toastPushed('success', 'Subscription cancelled.'));
    } catch {
      /* surfaced by global toast */
    }
  };

  if (isLoading) {
    return (
      <section className={styles.shell}>
        <p className={styles.muted}>Loading subscription…</p>
      </section>
    );
  }

  if (!subscription) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Dashboard · Subscription</span>
          <h1 className={styles.title}>You don&rsquo;t have a plan yet.</h1>
          <p className={styles.sub}>
            Pick a plan to start publishing listings, growing your agency, and unlocking
            featured placements.
          </p>
        </header>
        <Link href="/pricing">
          <Button size="lg">See pricing plans</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Dashboard · Subscription</span>
        <h1 className={styles.title}>Your plan</h1>
        <p className={styles.sub}>
          Manage your tier, see when your access renews, and upgrade when you outgrow your
          current limits.
        </p>
      </header>

      <PlanCard subscription={subscription} plan={plan} localCurrency={localCurrency} />

      <div className={styles.actions}>
        <Link href="/pricing">
          <Button size="lg" variant="secondary">
            Change plan
          </Button>
        </Link>
        {subscription.status === 'active' && !subscription.cancelledAt ? (
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={onCancel}
            disabled={cancelling}
            className={styles.cancel}
          >
            {cancelling ? 'Cancelling…' : 'Cancel subscription'}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function PlanCard({
  subscription,
  plan,
  localCurrency,
}: {
  subscription: Subscription;
  plan: SubscriptionPlan | undefined;
  localCurrency: string;
}) {
  const statusLabel: Record<Subscription['status'], string> = {
    'pending-payment': 'Awaiting payment',
    active: 'Active',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  /* Prefer the matching local-currency price if the plan has one,
   * otherwise the USD anchor, otherwise the first price. Display is
   * always in the local currency (converted); the canonical billing
   * value goes underneath. */
  const billingPrice =
    plan?.prices.find((p) => p.currency === localCurrency.toUpperCase()) ??
    plan?.prices.find((p) => p.currency === 'USD') ??
    plan?.prices[0];
  const showApprox =
    !!billingPrice && billingPrice.currency.toUpperCase() !== localCurrency.toUpperCase();
  const displayAmount = billingPrice
    ? Math.round(convertAmount(billingPrice.amount, billingPrice.currency, localCurrency))
    : 0;
  return (
    <article className={styles.planCard}>
      <header className={styles.planHead}>
        <div>
          <h2 className={styles.planName}>{plan?.name ?? subscription.planSlug}</h2>
          {plan?.tagline ? <p className={styles.planTagline}>{plan.tagline}</p> : null}
        </div>
        <span className={cn(styles.statusPill, styles[`status_${subscription.status}`])}>
          {statusLabel[subscription.status]}
        </span>
      </header>

      <dl className={styles.meta}>
        {billingPrice && billingPrice.amount > 0 ? (
          <div className={styles.metaRow}>
            <dt>Price</dt>
            <dd>
              {showApprox ? `≈ ${formatPrice(displayAmount, localCurrency)} ` : ''}
              <strong>{formatPrice(billingPrice.amount, billingPrice.currency)}</strong>
              {plan?.interval && plan.interval !== 'one-time'
                ? ` / ${plan.interval === 'year' ? 'yr' : 'mo'}`
                : ''}
            </dd>
          </div>
        ) : null}
        <div className={styles.metaRow}>
          <dt>Started</dt>
          <dd>
            {subscription.startedAt
              ? new Date(subscription.startedAt).toLocaleDateString('en-US', {
                  dateStyle: 'medium',
                })
              : '—'}
          </dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{subscription.cancelledAt ? 'Access until' : 'Renews on'}</dt>
          <dd>
            {subscription.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                  dateStyle: 'medium',
                })
              : '—'}
          </dd>
        </div>
      </dl>

      {plan ? (
        <ul className={styles.features}>
          {plan.features.map((f, i) => (
            <li
              key={i}
              className={cn(
                styles.feature,
                f.included ? styles.featureOn : styles.featureOff,
              )}
            >
              <span className={styles.featureIcon} aria-hidden="true">
                {f.included ? '✓' : '✕'}
              </span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
