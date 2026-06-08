'use client';

import { useState } from 'react';
import {
  EMAIL_PROVIDER_KEYS,
  EMAIL_PROVIDER_LABELS,
  type EmailProviderKey,
} from '@contracts';
import {
  useGetEmailSettingsQuery,
  useSendTestEmailMutation,
  useUpdateEmailSettingsMutation,
} from '@/features/email';
import { selectCurrentUser } from '@/features/auth';
import { toastPushed } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './EmailManager.module.scss';

/* ─────────────────────────────────────────────────────────────────────────
 * Admin email-settings manager.
 *
 *  - Provider selector (Console / Resend / SMTP). The page only shows
 *    the credential form for the *currently selected* provider so the
 *    operator isn't distracted by config they don't need.
 *  - Resend: just an API key.
 *    out of the box, HTTPS-only, no port allow-listing.
 *  - SMTP: host / port / secure / user / password. For operators who
 *    already run their own mail.
 *  - "Send test email" fires a one-shot to whichever recipient the
 *    admin types — defaults to their own authed address.
 *
 * Secrets are encrypted at rest by the backend. The masked status
 * field shows last-4 digits so the admin can confirm what's saved
 * without ever exposing the key in plaintext.
 * ──────────────────────────────────────────────────────────────────── */

type ResendDraft = { apiKey?: string };
type SmtpDraft = {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
};

export function EmailManager() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { data: settings, isLoading } = useGetEmailSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateEmailSettingsMutation();
  const [sendTest, { isLoading: sending }] = useSendTestEmailMutation();

  const [provider, setProvider] = useState<EmailProviderKey | null>(null);
  const [fromAddress, setFromAddress] = useState<string | null>(null);
  const [fromName, setFromName] = useState<string | null>(null);
  const [resendDraft, setResendDraft] = useState<ResendDraft>({});
  const [smtpDraft, setSmtpDraft] = useState<SmtpDraft>({});
  const [testRecipient, setTestRecipient] = useState<string>('');

  if (isLoading || !settings) {
    return (
      <section className={styles.shell}>
        <p className={styles.muted}>Loading email settings…</p>
      </section>
    );
  }

  /* `provider` etc. start as null so the inputs reflect the saved doc
   * until the admin actually edits something. Coalesce here. */
  const effectiveProvider = provider ?? settings.provider;
  const effectiveFromAddress = fromAddress ?? settings.fromAddress;
  const effectiveFromName = fromName ?? settings.fromName;
  const effectiveTestRecipient = testRecipient || user?.email || '';

  const onSaveTopLevel = async () => {
    try {
      await updateSettings({
        provider: effectiveProvider,
        fromAddress: effectiveFromAddress,
        fromName: effectiveFromName,
      }).unwrap();
      dispatch(toastPushed('success', 'Email settings updated.'));
      setProvider(null);
      setFromAddress(null);
      setFromName(null);
    } catch {
      /* surfaced by global toast */
    }
  };

  const onSaveResend = async () => {
    if (Object.keys(resendDraft).length === 0) return;
    try {
      await updateSettings({ resend: resendDraft }).unwrap();
      dispatch(toastPushed('success', 'Resend credentials saved.'));
      setResendDraft({});
    } catch {
      /* surfaced by global toast */
    }
  };

  const onSaveSmtp = async () => {
    if (Object.keys(smtpDraft).length === 0) return;
    try {
      await updateSettings({ smtp: smtpDraft }).unwrap();
      dispatch(toastPushed('success', 'SMTP credentials saved.'));
      setSmtpDraft({});
    } catch {
      /* surfaced by global toast */
    }
  };

  const onSendTest = async () => {
    const to = effectiveTestRecipient.trim();
    if (!to) {
      dispatch(toastPushed('error', 'Pick a recipient email to send the test to.'));
      return;
    }
    try {
      const result = await sendTest({ to }).unwrap();
      dispatch(
        toastPushed(
          'success',
          `Test email sent to ${result.to} via ${settings.provider}.`,
        ),
      );
    } catch {
      /* surfaced by global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Email</span>
        <h1 className={styles.title}>Transactional email</h1>
        <p className={styles.sub}>
          Configure the provider used for verify-email, password resets and inquiry
          notifications. <strong>Resend</strong> is the easiest choice for hosted deploys
          (Railway, Vercel, Render) — it&rsquo;s HTTPS-only and works without SMTP port
          gymnastics.
        </p>
      </header>

      {/* ── Status pill ─────────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Status</h2>
        </header>
        <p className={styles.statusLine}>
          Current provider: <strong>{EMAIL_PROVIDER_LABELS[settings.provider]}</strong>
          <span
            className={cn(
              styles.statusPill,
              settings.ready ? styles.statusReady : styles.statusPartial,
            )}
          >
            {settings.ready ? 'Ready' : 'Needs setup'}
          </span>
        </p>
        {!settings.ready ? (
          <p className={styles.muted}>
            Fill in the required fields below and the status flips to <em>Ready</em>.
            Until then, transactional email is logged but not delivered.
          </p>
        ) : null}
      </section>

      {/* ── Top-level fields ────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>General</h2>
          <p className={styles.cardSub}>
            Provider, From identity. The From address must be on a domain you&rsquo;ve
            verified with the provider.
          </p>
        </header>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Provider</span>
            <select
              className={styles.select}
              value={effectiveProvider}
              onChange={(e) => setProvider(e.currentTarget.value as EmailProviderKey)}
            >
              {EMAIL_PROVIDER_KEYS.map((k) => (
                <option key={k} value={k}>
                  {EMAIL_PROVIDER_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="From address"
            value={effectiveFromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="no-reply@yourdomain.com"
          />
          <TextField
            label="From name"
            value={effectiveFromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="OSK"
          />
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            onClick={onSaveTopLevel}
            disabled={
              saving || (provider === null && fromAddress === null && fromName === null)
            }
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </section>

      {/* ── Resend credentials ──────────────────────────────────────── */}
      {effectiveProvider === 'resend' ? (
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Resend</h2>
            <p className={styles.cardSub}>
              Get a key from{' '}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                resend.com/api-keys
              </a>
              . Make sure your sending domain is verified — Resend accepts unverified
              sends but only delivers them to the account owner.
            </p>
          </header>
          <div className={styles.fields}>
            <SecretField
              label="API key"
              status={settings.resend.apiKey}
              value={resendDraft.apiKey ?? ''}
              onChange={(v) => setResendDraft({ apiKey: v })}
              placeholder="re_…"
              hint="Encrypted at rest. Leave blank to keep the saved value."
            />
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              size="sm"
              onClick={onSaveResend}
              disabled={saving || Object.keys(resendDraft).length === 0}
            >
              {saving ? 'Saving…' : 'Save Resend key'}
            </Button>
          </div>
        </section>
      ) : null}

      {/* ── SMTP credentials ────────────────────────────────────────── */}
      {effectiveProvider === 'smtp' ? (
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>SMTP</h2>
            <p className={styles.cardSub}>
              Any SMTP-capable host. For Outlook 365 use <code>smtp.office365.com</code>{' '}
              on port <code>587</code> with STARTTLS. For port <code>465</code> set{' '}
              <em>Secure</em> to true.
            </p>
          </header>
          <div className={styles.grid}>
            <TextField
              label="Host"
              value={smtpDraft.host ?? settings.smtp.host}
              onChange={(e) => setSmtpDraft((d) => ({ ...d, host: e.target.value }))}
              placeholder="smtp.example.com"
            />
            <TextField
              label="Port"
              type="number"
              value={String(smtpDraft.port ?? settings.smtp.port)}
              onChange={(e) =>
                setSmtpDraft((d) => ({
                  ...d,
                  port: Number(e.target.value) || 587,
                }))
              }
            />
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={smtpDraft.secure ?? settings.smtp.secure}
                onChange={(e) =>
                  setSmtpDraft((d) => ({ ...d, secure: e.currentTarget.checked }))
                }
              />
              <span>Secure (TLS on port 465)</span>
            </label>
            <TextField
              label="Username"
              value={smtpDraft.user ?? settings.smtp.user}
              onChange={(e) => setSmtpDraft((d) => ({ ...d, user: e.target.value }))}
              placeholder="apikey or you@example.com"
            />
            <SecretField
              label="Password"
              status={settings.smtp.password}
              value={smtpDraft.password ?? ''}
              onChange={(v) => setSmtpDraft((d) => ({ ...d, password: v }))}
              placeholder="App password or SMTP token"
            />
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              size="sm"
              onClick={onSaveSmtp}
              disabled={saving || Object.keys(smtpDraft).length === 0}
            >
              {saving ? 'Saving…' : 'Save SMTP config'}
            </Button>
          </div>
        </section>
      ) : null}

      {/* ── Test send ───────────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Send a test email</h2>
          <p className={styles.cardSub}>
            Uses the currently saved provider and credentials. If you just edited a field,
            click <em>Save</em> first.
          </p>
        </header>
        <div className={styles.testRow}>
          <TextField
            label="Recipient"
            value={effectiveTestRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder={user?.email ?? 'you@example.com'}
          />
          <Button
            type="button"
            onClick={onSendTest}
            disabled={sending || !settings.ready}
          >
            {sending ? 'Sending…' : 'Send test email'}
          </Button>
        </div>
        {!settings.ready ? (
          <p className={styles.muted}>
            Provider isn&rsquo;t fully configured — save credentials first.
          </p>
        ) : null}
      </section>
    </section>
  );
}

/* ─── building blocks ──────────────────────────────────────────────── */

interface SecretFieldProps {
  label: string;
  status: { configured: boolean; hint: string };
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
