'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAttachProofOfPaymentMutation, useGetPaymentQuery } from '@/features/payments';
import { useGetPaymentSettingsQuery } from '@/features/pricing';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, MediaUploader, type UploadedMedia } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './BankTransferPay.module.scss';

/* ─────────────────────────────────────────────────────────────────────────
 * Bank-transfer pay page.
 *
 *  Lands here from the /pricing checkout modal when the seller picks
 *  "Bank transfer". Shows three things:
 *    1. The amount + reference the seller has to wire.
 *    2. The bank instructions the admin configured under
 *       /admin/pricing → "Bank transfer instructions".
 *    3. A screenshot upload widget. Once the seller uploads a proof,
 *       the Payment row flips to 'processing' and the admin reviews
 *       it from /admin/payments before confirming.
 *
 *  Refreshable — if the seller already uploaded a proof we surface
 *  the "awaiting review" state instead of the upload widget.
 * ──────────────────────────────────────────────────────────────────── */

interface Props {
  paymentId: string;
}

export function BankTransferPay({ paymentId }: Props) {
  const dispatch = useAppDispatch();
  const { data: payment, isLoading, isError, error } = useGetPaymentQuery(paymentId);
  const { data: settings } = useGetPaymentSettingsQuery();
  const [attachProof, { isLoading: submitting }] = useAttachProofOfPaymentMutation();

  const [stagedUrl, setStagedUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className={styles.shell}>
        <p className={styles.muted}>Loading payment…</p>
      </section>
    );
  }

  if (isError || !payment) {
    const status = (error as { status?: number } | undefined)?.status;
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <h1 className={styles.title}>
            {status === 404 ? 'Payment not found.' : 'Could not load this payment.'}
          </h1>
          <p className={styles.sub}>
            <Link href="/dashboard/subscription">Back to your subscription</Link>
          </p>
        </header>
      </section>
    );
  }

  const isDone = payment.status === 'succeeded' || payment.status === 'refunded';
  const hasProof = !!payment.proofUrl;

  const onUploaded = (uploaded: UploadedMedia[]) => {
    const first = uploaded[0];
    if (first) setStagedUrl(first.url);
  };

  const onSubmit = async () => {
    if (!stagedUrl) {
      dispatch(toastPushed('error', 'Pick a screenshot first.'));
      return;
    }
    try {
      await attachProof({ id: payment.id, url: stagedUrl }).unwrap();
      dispatch(
        toastPushed(
          'success',
          'Proof submitted. We will review and activate your subscription.',
        ),
      );
      setStagedUrl(null);
    } catch {
      /* surfaced by global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Subscription · Bank transfer</p>
        <h1 className={styles.title}>Complete your payment</h1>
        <p className={styles.sub}>
          Wire the amount below to the bank details listed and upload a screenshot of the
          transfer. We&rsquo;ll review and activate your subscription as soon as the wire
          clears.
        </p>
      </header>

      {/* ── Amount card ─────────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Amount to transfer</h2>
        </header>
        <div className={styles.amountBlock}>
          <span className={styles.amount}>
            {formatPrice(payment.amount, payment.currency)}
          </span>
          <span className={styles.amountCurrency}>{payment.currency}</span>
        </div>
        {payment.providerRef ? (
          <p className={styles.ref}>
            Use this reference in the wire memo:{' '}
            <code className={styles.refCode}>{payment.providerRef}</code>
          </p>
        ) : null}
        <p className={styles.statusLine}>
          Current status:{' '}
          <span
            className={cn(
              styles.statusPill,
              isDone
                ? styles.statusDone
                : hasProof
                  ? styles.statusReview
                  : styles.statusPending,
            )}
          >
            {isDone ? 'Paid' : hasProof ? 'Awaiting review' : 'Awaiting payment'}
          </span>
        </p>
      </section>

      {/* ── Bank instructions ──────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Bank details</h2>
        </header>
        {settings?.bankInstructions ? (
          <pre className={styles.instructions}>{settings.bankInstructions}</pre>
        ) : (
          <p className={styles.muted}>
            The operator hasn&rsquo;t configured bank instructions yet. Contact support
            before sending a transfer.
          </p>
        )}
      </section>

      {/* ── Proof upload ───────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Proof of payment</h2>
          <p className={styles.cardSub}>
            Upload a screenshot or photo of the transfer confirmation from your bank. Once
            we verify it, your subscription goes live automatically.
          </p>
        </header>

        {hasProof && payment.proofUrl ? (
          <div className={styles.proofExisting}>
            <a
              href={payment.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.proofLink}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.proofUrl}
                alt="Proof of payment"
                className={styles.proofImage}
              />
            </a>
            <p className={styles.proofMeta}>
              Submitted
              {payment.proofUploadedAt
                ? ` on ${new Date(payment.proofUploadedAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}`
                : ''}
              . An admin will review shortly.
            </p>
          </div>
        ) : isDone ? (
          <p className={styles.muted}>
            This payment is already settled — no proof needed.
          </p>
        ) : (
          <>
            <MediaUploader
              accept="image"
              multiple={false}
              label="Drop the screenshot or click to browse"
              hint="JPG, PNG, or WebP. Keep the amount and reference visible."
              onUploaded={onUploaded}
            />
            {stagedUrl ? (
              <div className={styles.stagedRow}>
                <span className={styles.stagedHint}>Screenshot ready —</span>
                <Button type="button" onClick={onSubmit} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit proof'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <p className={styles.footerLink}>
        <Link href="/dashboard/subscription">← Back to your subscription</Link>
      </p>
    </section>
  );
}
