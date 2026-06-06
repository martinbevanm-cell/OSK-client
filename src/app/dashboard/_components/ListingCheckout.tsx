'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PROVIDER_LABELS,
  type Payment,
  type Property,
  type ProviderKey,
  type ResolvedPrice,
} from '@contracts';
import { useGetPropertyQuery } from '@/features/properties';
import { useGetPaymentSettingsQuery, useLazyResolvePriceQuery } from '@/features/pricing';
import {
  useCreatePaymentIntentMutation,
  useListPropertyPaymentsQuery,
} from '@/features/payments';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './ListingCheckout.module.scss';

/* ─── small helpers ─────────────────────────────────────────────────── */

function isProviderEnabled(enabled: ProviderKey[], key: ProviderKey): boolean {
  return enabled.includes(key);
}

const PAYSTACK_SUPPORTED_CURRENCIES = new Set([
  'NGN',
]);

function providerSupportsCurrency(
  provider: ProviderKey,
  currency: string | null | undefined,
): boolean {
  if (provider !== 'paystack') return true;
  if (!currency) return true;
  return PAYSTACK_SUPPORTED_CURRENCIES.has(currency.toUpperCase());
}

function statusLabel(p: Property): string {
  if (p.status === 'awaiting-payment') return 'Awaiting payment';
  if (p.status === 'published') return 'Published';
  if (p.status === 'pending-review') return 'Pending review';
  if (p.status === 'draft') return 'Draft';
  if (p.status === 'rejected') return 'Rejected';
  return p.status;
}

/**
 * Seller checkout page for a single approved-but-unpaid listing.
 *
 * Resolves the price for the listing, shows the seller the providers the
 * admin has enabled, and creates a payment intent when they pick one.
 * On success the seller is redirected to the provider's hosted page; on
 * return we surface the status banner via the `?status=` query.
 */
export function ListingCheckout({ slug }: { slug: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const { data: property, isLoading: loadingProperty } =
    useGetPropertyQuery(slug);
  const { data: settings, isLoading: loadingSettings } =
    useGetPaymentSettingsQuery();
  const [resolvePrice, { data: price, isFetching: pricing }] =
    useLazyResolvePriceQuery();
  const [createIntent, { isLoading: creating }] =
    useCreatePaymentIntentMutation();
  const { data: priorPayments } = useListPropertyPaymentsQuery(
    property?.id ?? '',
    { skip: !property?.id },
  );

  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(
    null,
  );

  const availableProviders = useMemo(() => {
    if (!settings) return [];
    return settings.enabledProviders.filter((p) =>
      providerSupportsCurrency(p, price?.currency),
    );
  }, [settings, price?.currency]);

  /* Pull the price as soon as we have a property. */
  useEffect(() => {
    if (!property) return;
    void resolvePrice({
      propertyType: property.type,
      listingKind: property.listingKind,
      country: property.country,
      featured: property.isFeatured,
    });
  }, [property, resolvePrice]);

  /* Default provider selection — first available one for this currency. */
  useEffect(() => {
    if (selectedProvider || availableProviders.length === 0) return;
    const first = availableProviders[0];
    if (first) setSelectedProvider(first);
  }, [availableProviders, selectedProvider]);

  /* If currency changes and the current provider becomes invalid, swap to
   * the first available method so submit can't hit a guaranteed conflict. */
  useEffect(() => {
    if (!selectedProvider) return;
    if (availableProviders.includes(selectedProvider)) return;
    setSelectedProvider(availableProviders[0] ?? null);
  }, [availableProviders, selectedProvider]);

  const statusBanner = useMemo(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      return {
        kind: 'success' as const,
        text: 'Payment completed. We&rsquo;re finalising and your listing will publish in moments.',
      };
    }
    if (status === 'cancelled') {
      return {
        kind: 'warning' as const,
        text: 'Payment was cancelled. Pick a method below to try again.',
      };
    }
    return null;
  }, [searchParams]);

  const onPay = async () => {
    if (!property || !selectedProvider) return;
    try {
      const result = await createIntent({
        propertyId: property.id,
        provider: selectedProvider,
      }).unwrap();
      if (selectedProvider === 'bank-transfer') {
        /* Bank transfer has no hosted page — show the in-page instructions. */
        dispatch(
          toastPushed(
            'info',
            'Bank transfer started — we&rsquo;ll publish your listing once the wire clears.',
          ),
        );
        router.refresh();
      } else {
        window.location.href = result.redirectUrl;
      }
    } catch {
      /* surfaced by the global toast */
    }
  };

  if (loadingProperty || loadingSettings) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Checkout</span>
          <h1 className={styles.title}>Loading…</h1>
        </header>
      </section>
    );
  }

  if (!property) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Checkout</span>
          <h1 className={styles.title}>Listing not found</h1>
          <Link href="/dashboard/listings" className={styles.back}>
            ← Back to listings
          </Link>
        </header>
      </section>
    );
  }

  if (!settings?.paymentsEnabled) {
    return <PaymentsOffNotice property={property} />;
  }

  if (property.status === 'published') {
    return <AlreadyPaidNotice property={property} payments={priorPayments} />;
  }

  if (property.status !== 'awaiting-payment') {
    return <NotEligibleNotice property={property} />;
  }

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>Pay to publish</h1>
        <p className={styles.sub}>
          Your listing was approved. Once your payment clears we&rsquo;ll
          publish &ldquo;{property.title}&rdquo; on OSK.
        </p>
        <Link href="/dashboard/listings" className={styles.back}>
          ← Back to listings
        </Link>
      </header>

      {statusBanner ? (
        <div
          className={cn(
            styles.banner,
            statusBanner.kind === 'success'
              ? styles.bannerSuccess
              : styles.bannerWarning,
          )}
          role="status"
        >
          {statusBanner.text}
        </div>
      ) : null}

      <PriceSummary
        property={property}
        price={price ?? null}
        pricing={pricing}
      />

      <ProviderPicker
        enabled={availableProviders}
        selected={selectedProvider}
        onSelect={setSelectedProvider}
        unsupportedCurrency={
          settings.enabledProviders.includes('paystack') &&
          !providerSupportsCurrency('paystack', price?.currency)
            ? price?.currency ?? null
            : null
        }
      />

      {selectedProvider === 'bank-transfer' ? (
        <BankInstructions instructions={settings.bankInstructions} />
      ) : null}

      <div className={styles.actions}>
        <Button
          type="button"
          size="lg"
          onClick={onPay}
          disabled={
            !selectedProvider ||
            !price ||
            price.total === 0 ||
            creating
          }
        >
          {creating
            ? 'Starting…'
            : selectedProvider === 'bank-transfer'
              ? 'Confirm bank-transfer intent'
              : `Pay with ${selectedProvider ? PROVIDER_LABELS[selectedProvider] : '…'}`}
        </Button>
        <p className={styles.fine}>
          You&rsquo;ll be redirected to your provider to complete the payment.
          Listing publishes automatically once we receive confirmation.
        </p>
      </div>
    </section>
  );
}

/* ─── sub-components ───────────────────────────────────────────────── */

function PriceSummary({
  property,
  price,
  pricing,
}: {
  property: Property;
  price: ResolvedPrice | null;
  pricing: boolean;
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Order summary</h2>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Listing</dt>
          <dd>{property.title}</dd>
        </div>
        <div className={styles.row}>
          <dt>Type</dt>
          <dd>
            {property.type} · {property.listingKind}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Country</dt>
          <dd>{property.country}</dd>
        </div>
        <div className={styles.row}>
          <dt>Base price</dt>
          <dd>
            {price
              ? `${price.base.amount.toLocaleString('en-US')} ${price.base.currency}`
              : pricing
                ? 'Resolving…'
                : '—'}
          </dd>
        </div>
        {price?.featured ? (
          <div className={styles.row}>
            <dt>Featured upgrade</dt>
            <dd>
              {price.featured.amount.toLocaleString('en-US')}{' '}
              {price.featured.currency}
            </dd>
          </div>
        ) : null}
        <div className={cn(styles.row, styles.totalRow)}>
          <dt>Total</dt>
          <dd>
            <strong>
              {price
                ? `${price.total.toLocaleString('en-US')} ${price.currency}`
                : '—'}
            </strong>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ProviderPicker({
  enabled,
  selected,
  onSelect,
  unsupportedCurrency,
}: {
  enabled: ProviderKey[];
  selected: ProviderKey | null;
  onSelect: (p: ProviderKey) => void;
  unsupportedCurrency: string | null;
}) {
  if (enabled.length === 0) {
    return (
      <section className={styles.card}>
        {unsupportedCurrency ? (
          <p className={styles.muted}>
            Paystack is unavailable for {unsupportedCurrency}. Please enable
            Stripe, PayPal, or bank transfer for this listing currency.
          </p>
        ) : null}
        <p className={styles.muted}>
          No payment methods are enabled right now. Please contact support to
          publish this listing.
        </p>
      </section>
    );
  }
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Payment method</h2>
      {unsupportedCurrency ? (
        <p className={styles.muted}>
          Paystack is unavailable for {unsupportedCurrency}. Please use Stripe,
          PayPal, or bank transfer.
        </p>
      ) : null}
      <ul className={styles.providerGrid}>
        {enabled.map((key) => {
          const active = selected === key;
          return (
            <li key={key}>
              <button
                type="button"
                className={cn(
                  styles.providerCard,
                  active && styles.providerCardActive,
                )}
                onClick={() => onSelect(key)}
                aria-pressed={active}
              >
                <span className={styles.providerName}>
                  {PROVIDER_LABELS[key]}
                </span>
                <span className={styles.providerHint}>
                  {key === 'stripe'
                    ? 'Cards · Apple Pay · Google Pay'
                    : key === 'paypal'
                      ? 'Pay with PayPal balance or card'
                      : key === 'paystack'
                        ? 'Cards, mobile money, USSD'
                        : 'Manual wire — admin confirms when received'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function BankInstructions({ instructions }: { instructions: string }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Bank transfer instructions</h2>
      <pre className={styles.pre}>{instructions}</pre>
      <p className={styles.muted}>
        Use your listing title in the wire reference so we can match the
        payment. We&rsquo;ll publish the listing once your transfer clears.
      </p>
    </section>
  );
}

/* ─── alternative states ───────────────────────────────────────────── */

function PaymentsOffNotice({ property }: { property: Property }) {
  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>Payments are off — you&rsquo;re good</h1>
        <p className={styles.sub}>
          Charging is currently disabled by OSK admins, so &ldquo;
          {property.title}&rdquo; will publish without a payment.
        </p>
        <Link href="/dashboard/listings" className={styles.back}>
          ← Back to listings
        </Link>
      </header>
    </section>
  );
}

function AlreadyPaidNotice({
  property,
  payments,
}: {
  property: Property;
  payments?: Payment[];
}) {
  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>This listing is already live</h1>
        <p className={styles.sub}>
          &ldquo;{property.title}&rdquo; is published. No payment is due.
        </p>
        <Link href={`/property/${property.slug}`} className={styles.back}>
          View public listing →
        </Link>
      </header>
      {payments && payments.length > 0 ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Payment history</h2>
          <ul className={styles.history}>
            {payments.map((p) => (
              <li key={p.id} className={styles.historyRow}>
                <span>{PROVIDER_LABELS[p.provider]}</span>
                <span className={styles.muted}>
                  {p.amount.toLocaleString('en-US')} {p.currency}
                </span>
                <span className={styles.muted}>{p.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function NotEligibleNotice({ property }: { property: Property }) {
  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>Not ready for payment yet</h1>
        <p className={styles.sub}>
          &ldquo;{property.title}&rdquo; is currently &ldquo;
          {statusLabel(property)}&rdquo;. Payments only become available
          after an admin approves the listing.
        </p>
        <Link href="/dashboard/listings" className={styles.back}>
          ← Back to listings
        </Link>
      </header>
    </section>
  );
}
