'use client';

import { useState } from 'react';
import {
  CAPTCHA_PROVIDER_KEYS,
  CAPTCHA_PROVIDER_LABELS,
  type CaptchaProvider,
} from '@contracts';
import {
  useGetCaptchaSettingsQuery,
  useUpdateCaptchaSettingsMutation,
} from '@/features/captcha';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './CaptchaManager.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Admin captcha-settings manager.
 *
 * Currently supports Cloudflare Turnstile — free, privacy-friendly,
 * and the only provider with first-class HTTPS-only verification.
 * Adding more providers later is just a new entry in
 * `CAPTCHA_PROVIDER_KEYS` + a verify branch in the backend service.
 *
 * Secrets are encrypted at rest by the backend. The masked status
 * field shows the last few chars so the admin can confirm what's
 * saved without ever exposing the key in plaintext.
 * ──────────────────────────────────────────────────────────────── */

type Draft = {
  provider?: CaptchaProvider;
  siteKey?: string;
  secretKey?: string;
};

export function CaptchaManager() {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading } = useGetCaptchaSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateCaptchaSettingsMutation();

  const [draft, setDraft] = useState<Draft>({});

  if (isLoading || !settings) {
    return (
      <section className={styles.shell}>
        <p className={styles.muted}>Loading captcha settings…</p>
      </section>
    );
  }

  /* All these defaults guard against an older DB doc that pre-dates one
   * of the fields. Mongoose only applies `default:` on save, not on read,
   * so a doc created before a field was added will surface as `undefined`
   * here — without the ?? falls the select / input would crash on first
   * render. */
  const effectiveProvider: CaptchaProvider =
    draft.provider ?? settings.provider ?? 'none';
  const effectiveSiteKey = draft.siteKey ?? settings.siteKey ?? '';
  const secretConfigured = settings.secret?.configured ?? false;
  const secretHint = settings.secret?.hint ?? '';
  const isDirty =
    draft.provider !== undefined ||
    draft.siteKey !== undefined ||
    draft.secretKey !== undefined;

  const onSave = async () => {
    if (!isDirty) return;
    try {
      await updateSettings(draft).unwrap();
      dispatch(toastPushed('success', 'Captcha settings updated.'));
      setDraft({});
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Captcha</span>
        <h1 className={styles.title}>Signup captcha</h1>
        <p className={styles.sub}>
          Add a captcha challenge to the public sign-up form to stop bot accounts. We use{' '}
          <strong>Cloudflare Turnstile</strong> — it&rsquo;s free, privacy-friendly, and
          usually invisible to legitimate users. Disabled by default; turn it on by
          choosing a provider and pasting the site / secret keys.
        </p>
      </header>

      {/* ── Status pill ─────────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Status</h2>
        </header>
        <p className={styles.statusLine}>
          Current provider:{' '}
          <strong>{CAPTCHA_PROVIDER_LABELS[settings.provider ?? 'none']}</strong>
          <span
            className={cn(
              styles.statusPill,
              settings.ready ? styles.statusReady : styles.statusPartial,
            )}
          >
            {settings.ready ? 'Active' : 'Off'}
          </span>
        </p>
        {!settings.ready ? (
          <p className={styles.muted}>
            {effectiveProvider === 'local'
              ? 'Saving the Local provider activates the built-in text captcha — no keys required.'
              : 'Fill in the site & secret keys below and the captcha switches on for new sign-ups. Until then signup works without a challenge.'}
          </p>
        ) : null}
      </section>

      {/* ── Provider + keys ─────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Provider</h2>
          <p className={styles.cardSub}>
            Pick <em>Disabled</em> to turn the captcha off — the site / secret keys are
            preserved so you can flip it back on without re-entering them.{' '}
            <strong>Built-in text captcha</strong> works out of the box (no keys, no
            third-party calls). For Turnstile, grab keys at{' '}
            <a
              className={styles.link}
              href="https://dash.cloudflare.com/?to=/:account/turnstile"
              target="_blank"
              rel="noreferrer"
            >
              dash.cloudflare.com/turnstile
            </a>
            .
          </p>
        </header>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Provider</span>
            <select
              className={styles.select}
              value={effectiveProvider}
              onChange={(e) => {
                const next = e.target.value as CaptchaProvider;
                setDraft((d) => ({ ...d, provider: next }));
              }}
            >
              {CAPTCHA_PROVIDER_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CAPTCHA_PROVIDER_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          {effectiveProvider === 'turnstile' ? (
            <>
              <TextField
                label="Site key"
                value={effectiveSiteKey}
                onChange={(e) => {
                  const next = e.target.value;
                  setDraft((d) => ({ ...d, siteKey: next }));
                }}
                placeholder="0x4AAAAAAA..."
                hint="Public — rendered into the signup widget."
              />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Secret key{' '}
                  {secretConfigured ? (
                    <span className={styles.fieldSaved}>· saved ({secretHint})</span>
                  ) : (
                    <span className={styles.fieldEmpty}>· not set</span>
                  )}
                </span>
                <input
                  type="password"
                  className={styles.input}
                  placeholder={secretConfigured ? '••••••••' : 'paste secret key'}
                  value={draft.secretKey ?? ''}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDraft((d) => ({ ...d, secretKey: next }));
                  }}
                  autoComplete="off"
                />
                <span className={styles.fieldHint}>
                  Encrypted at rest. Leave blank to keep the existing value.
                </span>
              </label>
            </>
          ) : null}
        </div>

        {effectiveProvider === 'local' ? (
          <p className={styles.muted}>
            The built-in text captcha generates a fresh distorted-text challenge for each
            signup and verifies the answer server-side. No keys needed — just hit Save.
            Note that this style is easier for OCR bots than Turnstile, so swap to
            Turnstile if you start seeing spam.
          </p>
        ) : null}

        <div className={styles.formActions}>
          <Button type="button" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </section>
    </section>
  );
}
