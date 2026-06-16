'use client';

import { useState } from 'react';
import {
  useGetGoogleAuthSettingsQuery,
  useUpdateGoogleAuthSettingsMutation,
  useGetGoogleAuthConfigQuery,
} from '@/features/googleAuth';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './GoogleAuthManager.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Admin Google sign-in manager.
 *
 * Workflow for the operator:
 *   1. Create OAuth credentials in Google Cloud Console.
 *   2. Paste this page's "Authorized redirect URI" into Google.
 *   3. Paste the resulting client ID + secret here.
 *   4. Flip Enabled. The "Continue with Google" button appears on
 *      the public auth forms.
 *
 * Secret is encrypted at rest by the backend; the page only shows
 * the masked status hint after save.
 * ──────────────────────────────────────────────────────────────── */

type Draft = {
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
};

export function GoogleAuthManager() {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading } = useGetGoogleAuthSettingsQuery();
  const { data: publicConfig } = useGetGoogleAuthConfigQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateGoogleAuthSettingsMutation();
  const [draft, setDraft] = useState<Draft>({});
  const [copied, setCopied] = useState(false);

  if (isLoading || !settings) {
    return (
      <section className={styles.shell}>
        <p className={styles.muted}>Loading Google sign-in settings…</p>
      </section>
    );
  }

  /* All these defaults guard against an older settings doc that
   * pre-dates one of the fields. Mongoose only applies `default:` on
   * save, not on read, so a partially-populated record would surface
   * as `null` / `undefined` here and crash the JSX downstream. */
  const effectiveEnabled = draft.enabled ?? settings.enabled ?? false;
  const effectiveClientId = draft.clientId ?? settings.clientId ?? '';
  const secretConfigured = settings.clientSecret?.configured ?? false;
  const secretHint = settings.clientSecret?.hint ?? '';
  const callbackUrl = publicConfig?.callbackUrl ?? '';
  const isDirty =
    draft.enabled !== undefined ||
    draft.clientId !== undefined ||
    draft.clientSecret !== undefined;

  const onCopy = async () => {
    if (!callbackUrl) return;
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — fall through */
    }
  };

  const onSave = async () => {
    if (!isDirty) return;
    try {
      await updateSettings(draft).unwrap();
      dispatch(toastPushed('success', 'Google sign-in settings updated.'));
      setDraft({});
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Google sign-in</span>
        <h1 className={styles.title}>Continue with Google</h1>
        <p className={styles.sub}>
          Let users sign in with their Google account. Disabled by default — paste the
          client ID &amp; secret from Google Cloud Console, flip Enabled, and the button
          appears on the public auth forms.
        </p>
      </header>

      {/* ── Status ──────────────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Status</h2>
        </header>
        <p className={styles.statusLine}>
          Google sign-in is <strong>{settings.enabled ? 'enabled' : 'disabled'}</strong>
          <span
            className={cn(
              styles.statusPill,
              settings.ready ? styles.statusReady : styles.statusPartial,
            )}
          >
            {settings.ready ? 'Active' : 'Off'}
          </span>
        </p>
        {!settings.ready && settings.enabled ? (
          <p className={styles.muted}>
            Enabled but missing keys. Paste the client ID and secret below to bring the
            button online.
          </p>
        ) : null}
      </section>

      {/* ── Setup instructions ─────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>1. Set up in Google Cloud</h2>
          <p className={styles.cardSub}>
            Visit{' '}
            <a
              className={styles.link}
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud → Credentials
            </a>
            , create an <em>OAuth client ID</em> of type <em>Web application</em>, and
            paste the callback URL below into the &ldquo;Authorized redirect URIs&rdquo;
            list.
          </p>
        </header>

        <div className={styles.callbackRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Authorized redirect URI</span>
            <input
              className={styles.input}
              readOnly
              value={callbackUrl}
              onClick={(e) => e.currentTarget.select()}
            />
          </label>
          <Button type="button" onClick={onCopy} disabled={!callbackUrl}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </section>

      {/* ── Credentials ─────────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>2. Paste your credentials</h2>
        </header>

        <div className={styles.grid}>
          <TextField
            label="Client ID"
            value={effectiveClientId}
            onChange={(e) => {
              const next = e.target.value;
              setDraft((d) => ({ ...d, clientId: next }));
            }}
            placeholder="123456-abc.apps.googleusercontent.com"
            hint="Public — rendered into the OAuth start URL."
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Client secret{' '}
              {secretConfigured ? (
                <span className={styles.fieldSaved}>· saved ({secretHint})</span>
              ) : (
                <span className={styles.fieldEmpty}>· not set</span>
              )}
            </span>
            <input
              type="password"
              className={styles.input}
              placeholder={secretConfigured ? '••••••••' : 'paste client secret'}
              value={draft.clientSecret ?? ''}
              onChange={(e) => {
                const next = e.target.value;
                setDraft((d) => ({ ...d, clientSecret: next }));
              }}
              autoComplete="off"
            />
            <span className={styles.fieldHint}>
              Encrypted at rest. Leave blank to keep the existing value.
            </span>
          </label>
        </div>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={effectiveEnabled}
            onChange={(e) => {
              /* Snapshot the value out of the SyntheticEvent BEFORE
               * passing it into the functional setState callback —
               * React may have nullified `e.currentTarget` by the
               * time the updater runs in a microtask. */
              const next = e.target.checked;
              setDraft((d) => ({ ...d, enabled: next }));
            }}
          />
          <span>
            Enable Google sign-in — show the &ldquo;Continue with Google&rdquo; button on
            the auth forms
          </span>
        </label>

        <div className={styles.formActions}>
          <Button type="button" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </section>
    </section>
  );
}
