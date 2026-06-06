'use client';

import { useState } from 'react';
import type {
  MaskedSecretField,
  PaymentSettings,
  ProviderKey,
} from '@contracts';
import { PROVIDER_LABELS } from '@contracts';
import { useUpdatePaymentSettingsMutation } from '@/features/pricing';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './ProviderCredentialsManager.module.scss';

/* ─────────────────────────────────────────────────────────────────────────
 * Provider credentials — one card per provider with editable secret
 * fields, per-provider Active toggle (mirrors enabledProviders), and a
 * Save button that fires only the fields actually changed.
 *
 * Reads the masked status from settings.providers (the backend never
 * ships raw secrets); writes raw values via the standard update mutation.
 * Empty string clears a saved value.
 * ──────────────────────────────────────────────────────────────────────── */

interface Props {
  settings: PaymentSettings;
}

/** Local draft state for a single provider's fields. `undefined` means
 *  "unchanged" (don't send), '' means "clear", and a non-empty string
 *  means "save this new value". */
type StripeDraft = { secretKey?: string; webhookSecret?: string };
type PayPalDraft = {
  clientId?: string;
  clientSecret?: string;
  apiBase?: string;
  webhookId?: string;
};
type PaystackDraft = { secretKey?: string };

export function ProviderCredentialsManager({ settings }: Props) {
  const dispatch = useAppDispatch();
  const [updateSettings, { isLoading: saving }] =
    useUpdatePaymentSettingsMutation();

  const [stripeDraft, setStripeDraft] = useState<StripeDraft>({});
  const [paypalDraft, setPaypalDraft] = useState<PayPalDraft>({});
  const [paystackDraft, setPaystackDraft] = useState<PaystackDraft>({});

  const isEnabled = (provider: ProviderKey) =>
    settings.enabledProviders.includes(provider);

  /** Flip a provider's enabled state — keeps the rest of the list intact. */
  const onToggleProvider = async (provider: ProviderKey, on: boolean) => {
    const next = new Set(settings.enabledProviders);
    if (on) next.add(provider);
    else next.delete(provider);
    try {
      await updateSettings({ enabledProviders: Array.from(next) }).unwrap();
    } catch {
      /* surfaced by the global toast */
    }
  };

  const saveStripe = async () => {
    if (Object.keys(stripeDraft).length === 0) return;
    try {
      await updateSettings({ stripe: stripeDraft }).unwrap();
      dispatch(toastPushed('success', 'Stripe credentials updated.'));
      setStripeDraft({});
    } catch {
      /* surfaced by the global toast */
    }
  };

  const savePayPal = async () => {
    if (Object.keys(paypalDraft).length === 0) return;
    try {
      await updateSettings({ paypal: paypalDraft }).unwrap();
      dispatch(toastPushed('success', 'PayPal credentials updated.'));
      setPaypalDraft({});
    } catch {
      /* surfaced by the global toast */
    }
  };

  const savePaystack = async () => {
    if (Object.keys(paystackDraft).length === 0) return;
    try {
      await updateSettings({ paystack: paystackDraft }).unwrap();
      dispatch(toastPushed('success', 'Paystack credentials updated.'));
      setPaystackDraft({});
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <h2 className={styles.title}>Provider credentials</h2>
        <p className={styles.sub}>
          Paste your API keys for each provider. Values are encrypted at
          rest and never shown again — you&rsquo;ll see a masked hint
          (last 4 chars) to confirm what&rsquo;s saved. Leave a field
          blank to keep its current value; enter just a single space and
          save to clear it.
        </p>
      </header>

      {/* ── Stripe ──────────────────────────────────────────────── */}
      <ProviderCard
        title="Stripe"
        provider="stripe"
        enabled={isEnabled('stripe')}
        onToggleEnabled={(on) => onToggleProvider('stripe', on)}
        configuredCount={
          [
            settings.providers.stripe.secretKey.configured,
            settings.providers.stripe.webhookSecret.configured,
          ].filter(Boolean).length
        }
        totalFields={2}
        saving={saving}
        onSave={saveStripe}
        hasChanges={Object.keys(stripeDraft).length > 0}
        docs="dashboard.stripe.com/apikeys"
      >
        <SecretField
          label="Secret key"
          status={settings.providers.stripe.secretKey}
          value={stripeDraft.secretKey ?? ''}
          onChange={(v) =>
            setStripeDraft((d) => ({ ...d, secretKey: v }))
          }
          placeholder="sk_live_… or sk_test_…"
        />
        <SecretField
          label="Webhook signing secret"
          status={settings.providers.stripe.webhookSecret}
          value={stripeDraft.webhookSecret ?? ''}
          onChange={(v) =>
            setStripeDraft((d) => ({ ...d, webhookSecret: v }))
          }
          placeholder="whsec_…"
          hint="From Stripe Dashboard → Developers → Webhooks → your endpoint."
        />
      </ProviderCard>

      {/* ── PayPal ───────────────────────────────────────────────── */}
      <ProviderCard
        title="PayPal"
        provider="paypal"
        enabled={isEnabled('paypal')}
        onToggleEnabled={(on) => onToggleProvider('paypal', on)}
        configuredCount={
          [
            settings.providers.paypal.clientId.configured,
            settings.providers.paypal.clientSecret.configured,
            settings.providers.paypal.webhookId.configured,
          ].filter(Boolean).length
        }
        totalFields={3}
        saving={saving}
        onSave={savePayPal}
        hasChanges={Object.keys(paypalDraft).length > 0}
        docs="developer.paypal.com/dashboard/applications"
      >
        <SecretField
          label="Client ID"
          status={settings.providers.paypal.clientId}
          value={paypalDraft.clientId ?? ''}
          onChange={(v) => setPaypalDraft((d) => ({ ...d, clientId: v }))}
          placeholder="Live or Sandbox client ID"
        />
        <SecretField
          label="Client secret"
          status={settings.providers.paypal.clientSecret}
          value={paypalDraft.clientSecret ?? ''}
          onChange={(v) =>
            setPaypalDraft((d) => ({ ...d, clientSecret: v }))
          }
          placeholder="Live or Sandbox client secret"
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>API base</span>
          <select
            className={styles.select}
            value={paypalDraft.apiBase ?? settings.providers.paypal.apiBase}
            onChange={(e) =>
              setPaypalDraft((d) => ({ ...d, apiBase: e.target.value }))
            }
          >
            <option value="https://api-m.sandbox.paypal.com">
              Sandbox · api-m.sandbox.paypal.com
            </option>
            <option value="https://api-m.paypal.com">
              Live · api-m.paypal.com
            </option>
          </select>
          <span className={styles.fieldHint}>
            Match this to whether the credentials above are Sandbox or Live.
          </span>
        </label>
        <SecretField
          label="Webhook ID"
          status={settings.providers.paypal.webhookId}
          value={paypalDraft.webhookId ?? ''}
          onChange={(v) =>
            setPaypalDraft((d) => ({ ...d, webhookId: v }))
          }
          placeholder="Webhook ID from your PayPal app"
        />
      </ProviderCard>

      {/* ── Paystack ─────────────────────────────────────────────── */}
      <ProviderCard
        title="Paystack"
        provider="paystack"
        enabled={isEnabled('paystack')}
        onToggleEnabled={(on) => onToggleProvider('paystack', on)}
        configuredCount={
          settings.providers.paystack.secretKey.configured ? 1 : 0
        }
        totalFields={1}
        saving={saving}
        onSave={savePaystack}
        hasChanges={Object.keys(paystackDraft).length > 0}
        docs="dashboard.paystack.com/#/settings/developer"
      >
        <SecretField
          label="Secret key"
          status={settings.providers.paystack.secretKey}
          value={paystackDraft.secretKey ?? ''}
          onChange={(v) =>
            setPaystackDraft((d) => ({ ...d, secretKey: v }))
          }
          placeholder="sk_live_… or sk_test_…"
          hint="Paystack also uses this key to sign webhook payloads — no separate webhook secret."
        />
      </ProviderCard>

      {/* ── Bank transfer (no creds) ─────────────────────────────── */}
      <div className={styles.bankNote}>
        <strong>Bank transfer</strong> has no API keys — it&rsquo;s
        manually confirmed by an admin from the Payments page after the
        wire clears. Toggle the method here:
        <label className={cn(styles.toggle, styles.toggleInline)}>
          <input
            type="checkbox"
            checked={isEnabled('bank-transfer')}
            onChange={(e) =>
              onToggleProvider('bank-transfer', e.currentTarget.checked)
            }
          />
          <span className={styles.toggleSlider} aria-hidden="true" />
        </label>
      </div>
    </section>
  );
}

/* ─── building blocks ──────────────────────────────────────────────── */

interface ProviderCardProps {
  title: string;
  provider: ProviderKey;
  enabled: boolean;
  onToggleEnabled: (on: boolean) => void;
  configuredCount: number;
  totalFields: number;
  saving: boolean;
  onSave: () => void;
  hasChanges: boolean;
  docs: string;
  children: React.ReactNode;
}

function ProviderCard({
  title,
  enabled,
  onToggleEnabled,
  configuredCount,
  totalFields,
  saving,
  onSave,
  hasChanges,
  docs,
  children,
}: ProviderCardProps) {
  const fullyConfigured = configuredCount === totalFields;
  const partially = configuredCount > 0 && !fullyConfigured;
  return (
    <article className={styles.card}>
      <header className={styles.cardHead}>
        <div className={styles.cardTitles}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardSub}>
            Keys at{' '}
            <a
              href={`https://${docs}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {docs}
            </a>
          </p>
        </div>
        <div className={styles.cardMeta}>
          <span
            className={cn(
              styles.statusPill,
              fullyConfigured
                ? styles.statusReady
                : partially
                  ? styles.statusPartial
                  : styles.statusEmpty,
            )}
          >
            {fullyConfigured
              ? 'Configured'
              : partially
                ? `${configuredCount}/${totalFields} set`
                : 'Not configured'}
          </span>
          <label className={styles.toggle} title="Enable for sellers">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggleEnabled(e.currentTarget.checked)}
            />
            <span className={styles.toggleSlider} aria-hidden="true" />
          </label>
        </div>
      </header>

      <div className={styles.fields}>{children}</div>

      <footer className={styles.cardFoot}>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving…' : hasChanges ? 'Save changes' : 'No changes'}
        </Button>
        {!enabled ? (
          <span className={styles.disabledNote}>
            This provider is OFF — sellers won&rsquo;t see it at checkout
            even if keys are set.
          </span>
        ) : null}
      </footer>
    </article>
  );
}

interface SecretFieldProps {
  label: string;
  status: MaskedSecretField;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}

function SecretField({
  label,
  status,
  value,
  onChange,
  placeholder,
  hint,
}: SecretFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {status.configured ? (
          <span className={styles.fieldSaved}> · saved {status.hint}</span>
        ) : (
          <span className={styles.fieldEmpty}> · not set</span>
        )}
      </span>
      <input
        type="password"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        spellCheck={false}
      />
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}
