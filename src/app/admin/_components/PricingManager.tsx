'use client';

import { ProviderCredentialsManager } from './ProviderCredentialsManager';
import {
  useGetPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
} from '@/features/pricing';
import { cn } from '@/lib/cn';
import styles from './PricingManager.module.scss';

/**
 * Payment configuration admin — global toggle, provider credentials
 * (Stripe / PayPal / Paystack / bank transfer) and bank-transfer
 * instructions.
 *
 * The old per-listing pricing-plan matrix has been removed in favour
 * of the subscription model. Subscription plans are managed in
 * `/admin/plans` (see `PlansManager.tsx`).
 */
export function PricingManager() {
  const { data: settings, isLoading: settingsLoading } =
    useGetPaymentSettingsQuery();
  const [updateSettings, { isLoading: savingSettings }] =
    useUpdatePaymentSettingsMutation();

  const setSetting = async <K extends 'paymentsEnabled' | 'bankInstructions'>(
    key: K,
    value: K extends 'paymentsEnabled' ? boolean : string,
  ) => {
    try {
      await updateSettings({ [key]: value }).unwrap();
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Payments</span>
        <h1 className={styles.title}>Payment configuration</h1>
        <p className={styles.sub}>
          Master switch, payment providers, and bank-transfer
          instructions. Each provider goes &ldquo;Active&rdquo; the
          moment its required credentials are saved &mdash; sellers
          can then pick it at subscription checkout.
        </p>
      </header>

      {/* ─── Global toggle card ─────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Global payments</h2>
          <p className={styles.cardSub}>
            Master switch. Off means subscription checkout is blocked
            and every paid plan refuses new subscribers until you flip
            this back on.
          </p>
        </header>
        {settingsLoading ? (
          <p className={styles.muted}>Loading…</p>
        ) : settings ? (
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.paymentsEnabled}
                disabled={savingSettings}
                onChange={(e) =>
                  setSetting('paymentsEnabled', e.currentTarget.checked)
                }
              />
              <span className={styles.toggleSlider} aria-hidden="true" />
              <span className={styles.toggleLabel}>
                Accept subscription payments
              </span>
            </label>
            <span
              className={cn(
                styles.statusPill,
                settings.paymentsEnabled ? styles.statusOn : styles.statusOff,
              )}
            >
              {settings.paymentsEnabled ? 'ENABLED' : 'OFF'}
            </span>
          </div>
        ) : null}
      </section>

      {/* ─── Provider readiness ─────────────────────────────────────── */}
      {settings ? (
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Provider status</h2>
            <p className={styles.cardSub}>
              A provider is &ldquo;Active&rdquo; only when its required
              keys are saved <em>and</em> it&apos;s enabled below. Stripe
              requires <strong>Secret key + Webhook secret</strong>.
              PayPal requires <strong>Client ID + Client secret + API base + Webhook ID</strong>.
              Paystack requires <strong>Secret key</strong>. Bank transfer
              needs no keys &mdash; it&apos;s confirmed manually from the
              Payments page.
            </p>
          </header>
          <ul className={styles.readyList}>
            {(['stripe', 'paypal', 'paystack', 'bank-transfer'] as const).map(
              (key) => {
                const enabled = settings.enabledProviders.includes(key);
                const ready = settings.providerReady[key];
                const active = enabled && ready && settings.paymentsEnabled;
                return (
                  <li key={key} className={styles.readyRow}>
                    <span className={styles.readyName}>
                      {labelFor(key)}
                    </span>
                    <span
                      className={cn(
                        styles.statusPill,
                        active
                          ? styles.statusReady
                          : enabled && !ready
                            ? styles.statusPartial
                            : styles.statusEmpty,
                      )}
                    >
                      {active
                        ? 'Active'
                        : !enabled
                          ? 'Disabled'
                          : !ready
                            ? 'Needs setup'
                            : 'Inactive'}
                    </span>
                  </li>
                );
              },
            )}
          </ul>
        </section>
      ) : null}

      {/* ─── Provider credentials + enable/disable ──────────────────── */}
      {settings ? <ProviderCredentialsManager settings={settings} /> : null}

      {/* ─── Bank instructions ─────────────────────────────────────── */}
      {settings?.enabledProviders.includes('bank-transfer') ? (
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Bank transfer instructions</h2>
            <p className={styles.cardSub}>
              Shown on the seller&apos;s checkout when they pick
              &ldquo;Bank transfer&rdquo;. Include the IBAN/SWIFT,
              beneficiary, and the note they should put in the
              reference line.
            </p>
          </header>
          <textarea
            className={styles.textarea}
            rows={6}
            defaultValue={settings.bankInstructions}
            onBlur={(e) =>
              setSetting('bankInstructions', e.currentTarget.value)
            }
            placeholder={[
              'Beneficiary: OSK Real Estate Escrow Ltd.',
              'Bank: North Atlantic Bank',
              'Account number: 0012457789',
              'IBAN: GB82NATB20481200124577',
              'SWIFT/BIC: NATBGB2L',
              'Reference: Use your listing title or property slug',
            ].join('\n')}
          />
        </section>
      ) : null}
    </section>
  );
}

function labelFor(key: 'stripe' | 'paypal' | 'paystack' | 'bank-transfer') {
  switch (key) {
    case 'stripe':
      return 'Stripe';
    case 'paypal':
      return 'PayPal';
    case 'paystack':
      return 'Paystack';
    case 'bank-transfer':
      return 'Bank transfer';
  }
}
