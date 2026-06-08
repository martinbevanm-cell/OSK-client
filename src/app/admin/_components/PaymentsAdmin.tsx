'use client';

import { PROVIDER_LABELS, type Payment, type PaymentStatus } from '@contracts';
import {
  useConfirmPaymentMutation,
  useListAdminPaymentsQuery,
} from '@/features/payments';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { cn } from '@/lib/cn';
import styles from './PaymentsAdmin.module.scss';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  succeeded: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** Admin view of every payment — and the lever to confirm bank transfers. */
export function PaymentsAdmin() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useListAdminPaymentsQuery();
  const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation();

  const items = data ?? [];

  const onConfirm = async (p: Payment) => {
    if (
      !confirm(
        `Mark this ${p.provider} payment of ${p.amount} ${p.currency} as succeeded?`,
      )
    ) {
      return;
    }
    try {
      await confirmPayment(p.id).unwrap();
      dispatch(toastPushed('success', 'Payment confirmed — subscription activated.'));
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Payments</span>
        <h1 className={styles.title}>Payments</h1>
        <p className={styles.sub}>
          Every payment intent across all providers. Bank-transfer rows surface the
          seller&apos;s uploaded screenshot for verification before you confirm. Stripe /
          PayPal / Paystack confirm automatically via webhook.
        </p>
      </header>

      {isLoading ? (
        <p className={styles.muted}>Loading payments…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load payments.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>No payments yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Target</th>
                <th>Proof</th>
                <th>Ref</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    {new Date(p.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>{PROVIDER_LABELS[p.provider]}</td>
                  <td>
                    <strong>
                      {p.amount.toLocaleString('en-US')} {p.currency}
                    </strong>
                  </td>
                  <td>
                    <span className={cn(styles.statusPill, styles[`status_${p.status}`])}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className={styles.mono}>
                    {p.subscriptionId
                      ? `sub:${p.subscriptionId.slice(-6)}`
                      : p.propertyId
                        ? `prop:${p.propertyId.slice(-6)}`
                        : '—'}
                  </td>
                  <td>
                    {p.proofUrl ? (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.proofLink}
                        title={
                          p.proofUploadedAt
                            ? `Uploaded ${new Date(p.proofUploadedAt).toLocaleString(
                                'en-US',
                                { dateStyle: 'medium', timeStyle: 'short' },
                              )}`
                            : undefined
                        }
                      >
                        View
                      </a>
                    ) : p.provider === 'bank-transfer' ? (
                      <span className={styles.muted}>Awaiting</span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.mono}>{p.providerRef ?? '—'}</td>
                  <td className={styles.rowActions}>
                    {p.status !== 'succeeded' &&
                    p.status !== 'refunded' &&
                    p.status !== 'cancelled' ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        disabled={confirming}
                        onClick={() => onConfirm(p)}
                      >
                        Mark paid
                      </button>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
