'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROVIDER_LABELS,
  type PaymentSettings,
  type PlanFeature,
  type PlanPrice,
  type ProviderKey,
  type SubscriptionPlan,
} from '@contracts';
import {
  useGetMySubscriptionQuery,
  useListSubscriptionPlansQuery,
  useSubscribeMutation,
} from '@/features/subscriptions';
import { selectActiveCountry } from '@/features/geo';
import { selectCurrentUser } from '@/features/auth';
import { useAppSelector } from '@/store/hooks';
import { useGetPaymentSettingsQuery } from '@/features/pricing';
import { currencyForCountry, currencySymbolForCountry } from '@/lib/geoData';
import { convertAmount } from '@/lib/fx';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './PricingPlans.module.scss';

/* ─────────────────────────────────────────────────────────────────────────
 * Public pricing grid.
 *
 *  Display vs. billing — the platform charges in a small set of real
 *  billing currencies (USD / CAD / NGN / GHS / ZAR / KES / EUR / GBP /
 *  AUD). Every plan card shows BOTH:
 *
 *    1. A converted "feels-local" price in the user's country currency
 *       (e.g. "≈ PKR 22,000") — for UX only.
 *    2. The canonical "Billed at X Y at checkout" caption — the
 *       guaranteed-correct figure the user will actually pay.
 *
 *  When the user picks a paid plan, a checkout-options modal opens
 *  listing every valid (provider, billing-currency, amount) tuple —
 *  driven by /pricing/settings.providerBillingCurrencies — so we never
 *  surface an impossible combo. The server re-validates the pick
 *  before creating the payment intent.
 * ──────────────────────────────────────────────────────────────────── */

export function PricingPlans() {
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const activeCountry = useAppSelector(selectActiveCountry);
  const localCurrency = useMemo(() => currencyForCountry(activeCountry), [activeCountry]);
  const localSymbol = useMemo(
    () => currencySymbolForCountry(activeCountry),
    [activeCountry],
  );

  const { data: plans, isLoading } = useListSubscriptionPlansQuery();
  const { data: paymentSettings } = useGetPaymentSettingsQuery();
  /* Only meaningful when the user is signed in — useGetMySubscription
   *  is auth-gated. Pre-auth the query falls back to no data and the
   *  "Current plan" badge simply doesn't render. */
  const { data: currentSubscription } = useGetMySubscriptionQuery(undefined, {
    skip: !user,
  });
  const [subscribe, { isLoading: submitting }] = useSubscribeMutation();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [busyOption, setBusyOption] = useState<string | null>(null);

  if (isLoading) {
    return <p className={styles.loading}>Loading plans…</p>;
  }

  if (!plans || plans.length === 0) {
    return (
      <p className={styles.empty}>No plans have been configured yet. Check back soon.</p>
    );
  }

  const isCurrentActive = (planId: string) =>
    !!currentSubscription &&
    currentSubscription.status === 'active' &&
    currentSubscription.planId === planId;

  const isCurrentPending = (planId: string) =>
    !!currentSubscription &&
    currentSubscription.status === 'pending-payment' &&
    currentSubscription.planId === planId;

  const onPick = async (plan: SubscriptionPlan) => {
    if (!user) {
      router.push(`/sign-in?returnTo=/pricing`);
      return;
    }

    /* Already on this plan and active — nothing to do. The card's CTA
     * is normally disabled in this state, so this branch only fires
     * if a user somehow re-triggers the click. */
    if (isCurrentActive(plan.id)) {
      router.push('/dashboard/subscription');
      return;
    }

    /* Switching from a current active plan to a different one — ask
     * before doing it. The backend overwrites the existing row, so
     * users on Gold who pick Premium will effectively be moved as
     * soon as the new payment clears. */
    if (
      currentSubscription &&
      currentSubscription.status === 'active' &&
      currentSubscription.planId !== plan.id
    ) {
      const ok = confirm(
        `You're currently on ${
          currentSubscription.planSlug
        }. Switching plans will replace it once payment clears. Continue?`,
      );
      if (!ok) return;
    }

    const isFree = plan.prices.length === 0 || plan.prices.every((p) => p.amount === 0);

    if (isFree) {
      setBusyOption(`free-${plan.id}`);
      try {
        await subscribe({ planId: plan.id }).unwrap();
        router.push('/dashboard/subscription?status=success');
      } catch {
        /* surfaced by the global toast */
      } finally {
        setBusyOption(null);
      }
      return;
    }

    /* Paid plans: open the picker so the seller chooses provider +
     * billing currency from the valid combos. */
    setSelectedPlan(plan);
  };

  const onPickOption = async (
    plan: SubscriptionPlan,
    provider: ProviderKey,
    currency: string,
  ) => {
    const key = `${plan.id}-${provider}-${currency}`;
    setBusyOption(key);
    try {
      const result = await subscribe({
        planId: plan.id,
        provider,
        currency,
      }).unwrap();
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        router.push('/dashboard/subscription?status=success');
      }
    } catch {
      /* surfaced by the global toast */
    } finally {
      setBusyOption(null);
    }
  };

  return (
    <>
      <div className={styles.grid}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            localCurrency={localCurrency}
            localSymbol={localSymbol}
            busy={busyOption === `free-${plan.id}`}
            isCurrentActive={isCurrentActive(plan.id)}
            isCurrentPending={isCurrentPending(plan.id)}
            onPick={() => onPick(plan)}
          />
        ))}
      </div>

      {selectedPlan && paymentSettings ? (
        <CheckoutPicker
          plan={selectedPlan}
          settings={paymentSettings}
          localCurrency={localCurrency}
          submitting={submitting}
          busyOption={busyOption}
          onPick={(provider, currency) => onPickOption(selectedPlan, provider, currency)}
          onCancel={() => setSelectedPlan(null)}
        />
      ) : null}
    </>
  );
}

/* ─── Plan card ───────────────────────────────────────────────────────── */

interface PlanCardProps {
  plan: SubscriptionPlan;
  localCurrency: string;
  localSymbol: string;
  busy: boolean;
  /** True when the user is already active on THIS plan. CTA flips to
   *  a disabled "Current plan" button and the card gets a "Current"
   *  ribbon. */
  isCurrentActive: boolean;
  /** True when the user has a pending-payment subscription on THIS
   *  plan. CTA becomes "Finish payment" so the seller can resume. */
  isCurrentPending: boolean;
  onPick: () => void;
}

function PlanCard({
  plan,
  localCurrency,
  localSymbol,
  busy,
  isCurrentActive,
  isCurrentPending,
  onPick,
}: PlanCardProps) {
  const isFree = plan.prices.length === 0 || plan.prices.every((p) => p.amount === 0);
  /* The canonical "billed at" anchor: prefer USD as the universal
   * baseline, otherwise the plan's first price. */
  const billingPrice = plan.prices.find((p) => p.currency === 'USD') ?? plan.prices[0];
  /* Convert it into the user's local currency for the big number. */
  const displayAmount = billingPrice
    ? Math.round(convertAmount(billingPrice.amount, billingPrice.currency, localCurrency))
    : 0;
  /* Skip the "≈ X" prefix when display currency matches the billing
   * currency — no conversion happened, the number is exact. */
  const showApprox =
    !!billingPrice && billingPrice.currency.toUpperCase() !== localCurrency.toUpperCase();

  return (
    <article
      className={cn(
        styles.card,
        plan.highlight && styles.cardHighlight,
        isCurrentActive && styles.cardCurrent,
      )}
    >
      {isCurrentActive ? (
        <span className={cn(styles.popular, styles.popularCurrent)}>Current plan</span>
      ) : plan.highlight ? (
        <span className={styles.popular}>Most popular</span>
      ) : null}
      <header className={styles.cardHead}>
        <h2 className={styles.name}>{plan.name}</h2>
        {plan.tagline ? <p className={styles.tagline}>{plan.tagline}</p> : null}
        <div className={styles.priceBlock}>
          {isFree ? (
            <span className={styles.priceFree}>Free</span>
          ) : (
            <>
              <span className={styles.priceAmount}>
                {showApprox ? '≈ ' : ''}
                {localSymbol}
                {displayAmount.toLocaleString('en-US')}
              </span>
              <span className={styles.priceCadence}>
                /
                {plan.interval === 'year'
                  ? 'yr'
                  : plan.interval === 'month'
                    ? 'mo'
                    : 'once'}
              </span>
            </>
          )}
        </div>
        {!isFree && billingPrice ? (
          <p className={styles.billedAt}>
            Billed at{' '}
            <strong>{formatPrice(billingPrice.amount, billingPrice.currency)}</strong> at
            checkout
          </p>
        ) : null}
      </header>

      <ul className={styles.features}>
        {plan.features.map((feature, i) => (
          <FeatureRow key={i} feature={feature} />
        ))}
      </ul>

      <Button
        type="button"
        size="lg"
        variant={isCurrentActive ? 'secondary' : 'primary'}
        disabled={busy || isCurrentActive}
        onClick={onPick}
        className={styles.cta}
      >
        {isCurrentActive
          ? 'Current plan'
          : isCurrentPending
            ? 'Finish payment'
            : busy
              ? 'Starting…'
              : isFree
                ? 'Get started'
                : `Choose ${plan.name}`}
      </Button>
    </article>
  );
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <li
      className={cn(
        styles.feature,
        feature.included ? styles.featureOn : styles.featureOff,
      )}
    >
      <span className={styles.featureIcon} aria-hidden="true">
        {feature.included ? '✓' : '✕'}
      </span>
      <span className={styles.featureLabel}>{feature.label}</span>
    </li>
  );
}

/* ─── Checkout picker modal ───────────────────────────────────────────── */

interface CheckoutPickerProps {
  plan: SubscriptionPlan;
  settings: PaymentSettings;
  localCurrency: string;
  submitting: boolean;
  busyOption: string | null;
  onPick: (provider: ProviderKey, currency: string) => void;
  onCancel: () => void;
}

/**
 * Cross-product of (enabled + ready providers) × (plan prices in
 * their supported currencies). Sorted so currencies matching the
 * user's local currency come first.
 */
function buildCheckoutOptions(
  plan: SubscriptionPlan,
  settings: PaymentSettings,
  localCurrency: string,
): Array<{ provider: ProviderKey; price: PlanPrice }> {
  if (!settings.paymentsEnabled) return [];
  const options: Array<{
    provider: ProviderKey;
    price: PlanPrice;
    score: number;
  }> = [];
  const upper = localCurrency.toUpperCase();
  for (const provider of settings.enabledProviders) {
    if (!settings.providerReady[provider]) continue;
    const supported = (settings.providerBillingCurrencies[provider] ?? []).map((c) =>
      c.toUpperCase(),
    );
    for (const price of plan.prices) {
      if (!supported.includes(price.currency.toUpperCase())) continue;
      options.push({
        provider,
        price,
        /* Lower score ranks higher — match local currency first, then
         * keep online providers ahead of bank-transfer so the seller
         * sees the fast path at the top. */
        score:
          (price.currency.toUpperCase() === upper ? 0 : 2) +
          (provider === 'bank-transfer' ? 1 : 0),
      });
    }
  }
  options.sort((a, b) => a.score - b.score);
  return options.map(({ provider, price }) => ({ provider, price }));
}

function CheckoutPicker({
  plan,
  settings,
  localCurrency,
  submitting,
  busyOption,
  onPick,
  onCancel,
}: CheckoutPickerProps) {
  const options = useMemo(
    () => buildCheckoutOptions(plan, settings, localCurrency),
    [plan, settings, localCurrency],
  );

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Choose how to pay for ${plan.name}`}
      onClick={onCancel}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHead}>
          <p className={styles.modalEyebrow}>Checkout</p>
          <h3 className={styles.modalTitle}>Pay for {plan.name}</h3>
          <p className={styles.modalSub}>
            Pick the payment method and currency you want to be charged in. We&rsquo;ll
            redirect you to the provider to complete payment.
          </p>
        </header>

        {options.length === 0 ? (
          <p className={styles.modalEmpty}>
            No payment method is available for this plan right now. Please contact
            support.
          </p>
        ) : (
          <ul className={styles.optionList}>
            {options.map(({ provider, price }) => {
              const key = `${plan.id}-${provider}-${price.currency}`;
              const busy = busyOption === key;
              return (
                <li key={key} className={styles.option}>
                  <div className={styles.optionMain}>
                    <span className={styles.optionProvider}>
                      {PROVIDER_LABELS[provider]}
                    </span>
                    <span className={styles.optionAmount}>
                      {formatPrice(price.amount, price.currency)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onPick(provider, price.currency)}
                    disabled={submitting || busy}
                  >
                    {busy ? 'Redirecting…' : 'Continue'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className={styles.modalFoot}>
          <button
            type="button"
            className={styles.modalCancel}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}

/* Re-export labels for dashboard fallbacks. */
export { PROVIDER_LABELS };
