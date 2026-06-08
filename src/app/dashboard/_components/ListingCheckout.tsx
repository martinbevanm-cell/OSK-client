'use client';

import Link from 'next/link';
import { PROVIDER_LABELS, type Payment, type Property } from '@contracts';
import { useGetPropertyQuery } from '@/features/properties';
import { useGetPaymentSettingsQuery } from '@/features/pricing';
import styles from './ListingCheckout.module.scss';

/* ─── small helpers ─────────────────────────────────────────────────── */

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
  const { data: property, isLoading: loadingProperty } = useGetPropertyQuery(slug);
  const { data: settings, isLoading: loadingSettings } = useGetPaymentSettingsQuery();

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
    return <AlreadyPaidNotice property={property} />;
  }

  if (property.status !== 'awaiting-payment') {
    return <NotEligibleNotice property={property} />;
  }

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>Checkout unavailable</h1>
        <p className={styles.sub}>
          The per-listing checkout flow is not supported by the current backend. Please
          contact support or use the subscriptions page to activate your listing.
        </p>
        <Link href="/dashboard/listings" className={styles.back}>
          ← Back to listings
        </Link>
      </header>
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
          {statusLabel(property)}&rdquo;. Payments only become available after an admin
          approves the listing.
        </p>
        <Link href="/dashboard/listings" className={styles.back}>
          ← Back to listings
        </Link>
      </header>
    </section>
  );
}
