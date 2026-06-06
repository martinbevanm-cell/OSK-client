'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  THEMES,
  type SiteSettingsLegal,
  type SiteSettings,
  type SiteSettingsStat,
  type ThemeName,
} from '@contracts';
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from '@/features/settings';
import { Button, MediaUploader, TextField } from '@/components/ui';
import type { UploadedMedia } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useAppDispatch } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import { cn } from '@/lib/cn';
import { GeoScopeManager } from './GeoScopeManager';
import styles from './SettingsManager.module.scss';

const THEME_LABELS: Record<ThemeName, { label: string; tagline: string }> = {
  'theme-luxe-light': { label: 'Luxe Light', tagline: 'Editorial · default' },
  'theme-luxe-dark': { label: 'Luxe Dark', tagline: 'Cinematic · low light' },
  'theme-emerald': { label: 'Emerald', tagline: 'Botanical · forest tones' },
  'theme-sandstone': { label: 'Sandstone', tagline: 'Warm · desert palette' },
};

/* Shape we render the form against — flat fields so editing is simple. */
interface FormState {
  activeTheme: ThemeName;
  siteTitle: string;
  companyName: string;
  logoUrl: string;
  email: string;
  phoneTel: string;
  phoneDisplay: string;
  addressLine1: string;
  addressCity: string;
  addressRegion: string;
  addressPostalCode: string;
  addressCountry: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  appQrUrl: string;
  homeStats: SiteSettingsStat[];
  privacyMarkdown: string;
  termsMarkdown: string;
  privacyUpdatedAt: string;
  termsUpdatedAt: string;
}

type SettingsTab = 'general' | 'legal';

const DEFAULT_HOME_STATS: SiteSettingsStat[] = [
  { value: '12,400+', label: 'Curated listings' },
  { value: '850+', label: 'Verified agents' },
  { value: '40+', label: 'Active markets' },
  { value: '$4.2B', label: 'Closed last year' },
];

const DEFAULT_LEGAL: SiteSettingsLegal = {
  privacyMarkdown: '',
  termsMarkdown: '',
  privacyUpdatedAt: '',
  termsUpdatedAt: '',
};

const DEFAULT_SITE_TITLE =
  'OSK Property Real Estate | Buy, Sell & Rent Homes & Properties.';

function fromSettings(s: SiteSettings): FormState {
  return {
    activeTheme: s.activeTheme,
    siteTitle: s.siteTitle ?? DEFAULT_SITE_TITLE,
    companyName: s.companyName,
    logoUrl: s.logoUrl,
    email: s.contact.email,
    phoneTel: s.contact.phoneTel,
    phoneDisplay: s.contact.phoneDisplay,
    addressLine1: s.contact.addressLine1,
    addressCity: s.contact.addressCity,
    addressRegion: s.contact.addressRegion,
    addressPostalCode: s.contact.addressPostalCode,
    addressCountry: s.contact.addressCountry,
    appStoreUrl: s.appLinks?.appStoreUrl ?? '',
    googlePlayUrl: s.appLinks?.googlePlayUrl ?? '',
    appQrUrl: s.appLinks?.appQrUrl ?? '',
    homeStats:
      Array.isArray(s.homeStats) && s.homeStats.length === 4
        ? s.homeStats
        : DEFAULT_HOME_STATS,
    privacyMarkdown: s.legal?.privacyMarkdown ?? DEFAULT_LEGAL.privacyMarkdown,
    termsMarkdown: s.legal?.termsMarkdown ?? DEFAULT_LEGAL.termsMarkdown,
    privacyUpdatedAt: s.legal?.privacyUpdatedAt ?? DEFAULT_LEGAL.privacyUpdatedAt,
    termsUpdatedAt: s.legal?.termsUpdatedAt ?? DEFAULT_LEGAL.termsUpdatedAt,
  };
}

export function SettingsManager() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useGetSiteSettingsQuery();
  const [saveSettings, { isLoading: saving }] = useUpdateSiteSettingsMutation();
  const [form, setForm] = useState<FormState | null>(null);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  useEffect(() => {
    if (!data) return;
    const next = fromSettings(data);
    setInitialForm(next);
    if (!form) setForm(next);
  }, [data, form]);

  const hasChanges =
    !!form && !!initialForm && JSON.stringify(form) !== JSON.stringify(initialForm);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));
  };

  const setHomeStat = (index: number, key: keyof SiteSettingsStat, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const nextStats = prev.homeStats.map((stat, i) =>
        i === index ? { ...stat, [key]: value } : stat,
      );
      return { ...prev, homeStats: nextStats };
    });
  };

  const onLogoUploaded = (uploaded: UploadedMedia[]) => {
    const first = uploaded[0];
    if (!first) return;
    setField('logoUrl', first.url);
    dispatch(toastPushed('success', 'Logo uploaded — save to apply.'));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    try {
      const saved = await saveSettings({
        activeTheme: form.activeTheme,
        siteTitle: form.siteTitle.trim(),
        companyName: form.companyName,
        logoUrl: form.logoUrl,
        contact: {
          email: form.email,
          phoneTel: form.phoneTel,
          phoneDisplay: form.phoneDisplay,
          addressLine1: form.addressLine1,
          addressCity: form.addressCity,
          addressRegion: form.addressRegion,
          addressPostalCode: form.addressPostalCode,
          addressCountry: form.addressCountry,
        },
        appLinks: {
          appStoreUrl: form.appStoreUrl.trim(),
          googlePlayUrl: form.googlePlayUrl.trim(),
          appQrUrl: form.appQrUrl.trim(),
        },
        homeStats: form.homeStats.map((stat) => ({
          value: stat.value.trim(),
          label: stat.label.trim(),
        })),
        legal: {
          privacyMarkdown: form.privacyMarkdown.trim(),
          termsMarkdown: form.termsMarkdown.trim(),
          privacyUpdatedAt: form.privacyUpdatedAt.trim(),
          termsUpdatedAt: form.termsUpdatedAt.trim(),
        },
      }).unwrap();
      const next = fromSettings(saved);
      setForm(next);
      setInitialForm(next);
      dispatch(toastPushed('success', 'Settings saved — site updated.'));
    } catch {
      /* surfaced by the global toast handles the error envelope */
    }
  };

  if (isLoading || !form) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Admin · Settings</span>
          <h1 className={styles.title}>Site settings</h1>
        </header>
        <p className={styles.muted}>Loading current settings…</p>
      </section>
    );
  }
  if (isError) {
    return (
      <section className={styles.shell}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>Admin · Settings</span>
          <h1 className={styles.title}>Site settings</h1>
        </header>
        <p className={styles.muted}>Couldn&rsquo;t load the current settings.</p>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Settings</span>
        <h1 className={styles.title}>Site settings</h1>
        <p className={styles.sub}>
          Change the active theme, company logo, and contact details for the whole site.
          Updates take effect immediately.
        </p>
      </header>

      <div className={styles.tabBar} role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'general'}
          className={cn(styles.tab, activeTab === 'general' && styles.tabActive)}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'legal'}
          className={cn(styles.tab, activeTab === 'legal' && styles.tabActive)}
          onClick={() => setActiveTab('legal')}
        >
          Legal
        </button>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        {activeTab === 'general' ? (
          <>
            {/* ── theme picker ────────────────────────────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Theme</h2>
              <p className={styles.sectionHint}>
                Applies to every visitor on every page. Use the previews to preview tokens
                — the live site already reflects your current choice as you scroll.
              </p>
              <div className={styles.themeGrid}>
                {THEMES.map((theme) => {
                  const active = form.activeTheme === theme;
                  const meta = THEME_LABELS[theme];
                  return (
                    <button
                      key={theme}
                      type="button"
                      className={cn(styles.themeCard, active && styles.themeCardOn)}
                      onClick={() => setField('activeTheme', theme)}
                      aria-pressed={active}
                    >
                      {/* Each preview applies the target theme class to a scoped
                       * region so admins can compare without committing. */}
                      <div className={cn(styles.themePreview, theme)}>
                        <span className={styles.swatchBg} />
                        <span className={styles.swatchPrimary} />
                        <span className={styles.swatchAccent} />
                        <span className={styles.swatchCard} />
                      </div>
                      <span className={styles.themeName}>{meta.label}</span>
                      <span className={styles.themeTagline}>{meta.tagline}</span>
                      {active ? <span className={styles.activeBadge}>Active</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── branding ─────────────────────────────────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Brand</h2>
              <TextField
                label="Website title"
                value={form.siteTitle}
                onChange={(e) => setField('siteTitle', e.target.value)}
                maxLength={120}
                hint="Used for browser tab title and SEO default title."
                required
              />
              <TextField
                label="Company name"
                value={form.companyName}
                onChange={(e) => setField('companyName', e.target.value)}
                maxLength={80}
                required
              />

              <div className={styles.logoRow}>
                <div className={styles.logoPreview} aria-hidden="true">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(form.logoUrl)}
                      alt=""
                      className={styles.logoImg}
                    />
                  ) : (
                    <span className={styles.logoPlaceholder}>
                      {form.companyName.slice(0, 2).toUpperCase() || 'OSK'}
                    </span>
                  )}
                </div>
                <div className={styles.logoControls}>
                  <span className={styles.fieldLabel}>Logo</span>
                  <MediaUploader
                    accept="image"
                    multiple={false}
                    label="Drop a logo or click to browse"
                    hint="PNG / SVG-as-PNG / WEBP — transparent backgrounds render best."
                    onUploaded={onLogoUploaded}
                  />
                  {form.logoUrl ? (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => setField('logoUrl', '')}
                    >
                      Remove current logo
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── contact ──────────────────────────────────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact</h2>
              <p className={styles.sectionHint}>
                Surfaces in the footer, contact page, and the footer of every
                transactional email we send.
              </p>
              <div className={styles.grid2}>
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                />
                <TextField
                  label="Phone (display)"
                  value={form.phoneDisplay}
                  onChange={(e) => setField('phoneDisplay', e.target.value)}
                  hint="What humans see — e.g. +1 (365) 955-7829"
                  required
                />
              </div>
              <TextField
                label="Phone (tel: link)"
                value={form.phoneTel}
                onChange={(e) => setField('phoneTel', e.target.value)}
                hint="Digits and a leading + only — e.g. +13659557829"
                required
              />

              <TextField
                label="Address line 1"
                value={form.addressLine1}
                onChange={(e) => setField('addressLine1', e.target.value)}
                required
              />
              <div className={styles.grid3}>
                <TextField
                  label="City"
                  value={form.addressCity}
                  onChange={(e) => setField('addressCity', e.target.value)}
                  required
                />
                <TextField
                  label="Region / state"
                  value={form.addressRegion}
                  onChange={(e) => setField('addressRegion', e.target.value)}
                  required
                />
                <TextField
                  label="Postal code"
                  value={form.addressPostalCode}
                  onChange={(e) => setField('addressPostalCode', e.target.value)}
                  required
                />
              </div>
              <TextField
                label="Country"
                value={form.addressCountry}
                onChange={(e) => setField('addressCountry', e.target.value)}
                required
              />
            </div>

            {/* ── mobile app ───────────────────────────────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Mobile app</h2>
              <p className={styles.sectionHint}>
                Drives the &ldquo;Get the OSK App&rdquo; poster on the home page. Each URL
                is optional — when every field is empty the poster stays hidden. The QR
                resolves to your <em>App QR URL</em> (a smart-link page that detects the
                visitor&rsquo;s OS works best), or falls back to whichever store URL
                you&rsquo;ve filled in.
              </p>
              <TextField
                label="App Store URL"
                type="url"
                value={form.appStoreUrl}
                onChange={(e) => setField('appStoreUrl', e.target.value)}
                placeholder="https://apps.apple.com/app/idXXXXXXXXX"
                hint="iOS App Store listing. Leave blank to hide the App Store badge."
              />
              <TextField
                label="Google Play URL"
                type="url"
                value={form.googlePlayUrl}
                onChange={(e) => setField('googlePlayUrl', e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=com.osk"
                hint="Google Play listing. Leave blank to hide the Play Store badge."
              />
              <TextField
                label="App QR URL"
                type="url"
                value={form.appQrUrl}
                onChange={(e) => setField('appQrUrl', e.target.value)}
                placeholder="https://osk.app/get"
                hint="Where the QR code points. Leave blank to hide the QR — we'll use one of the store URLs above as the QR target instead."
              />
            </div>

            {/* ── trust strip ─────────────────────────────────────────────── */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Homepage trust strip</h2>
              <p className={styles.sectionHint}>
                Controls the four headline stats shown directly below the hero on the home
                page.
              </p>
              {form.homeStats.map((stat, index) => (
                <div key={`trust-stat-${index + 1}`} className={styles.grid2}>
                  <TextField
                    label={`Stat ${index + 1} value`}
                    value={stat.value}
                    onChange={(e) => setHomeStat(index, 'value', e.target.value)}
                    maxLength={24}
                    required
                  />
                  <TextField
                    label={`Stat ${index + 1} label`}
                    value={stat.label}
                    onChange={(e) => setHomeStat(index, 'label', e.target.value)}
                    maxLength={40}
                    required
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Legal pages</h2>
            <p className={styles.sectionHint}>
              Edit the Privacy Policy and Terms content shown on the public marketing
              pages.
            </p>

            <div className={styles.grid2}>
              <TextField
                label="Privacy effective date"
                type="date"
                value={form.privacyUpdatedAt}
                onChange={(e) => setField('privacyUpdatedAt', e.target.value)}
                hint="Shown on /privacy. Format: YYYY-MM-DD."
              />
              <TextField
                label="Terms effective date"
                type="date"
                value={form.termsUpdatedAt}
                onChange={(e) => setField('termsUpdatedAt', e.target.value)}
                hint="Shown on /terms. Format: YYYY-MM-DD."
              />
            </div>

            <label className={styles.textareaField}>
              <span className={styles.fieldLabel}>Privacy content (Markdown)</span>
              <textarea
                className={styles.textarea}
                value={form.privacyMarkdown}
                onChange={(e) => setField('privacyMarkdown', e.target.value)}
                rows={14}
                maxLength={50000}
                placeholder="Write the privacy policy content in markdown..."
              />
            </label>

            <label className={styles.textareaField}>
              <span className={styles.fieldLabel}>Terms content (Markdown)</span>
              <textarea
                className={styles.textarea}
                value={form.termsMarkdown}
                onChange={(e) => setField('termsMarkdown', e.target.value)}
                rows={14}
                maxLength={50000}
                placeholder="Write the terms of service content in markdown..."
              />
            </label>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="submit" size="lg" disabled={saving || !hasChanges}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>

      {/* Country scope sits outside the main form because it has its own
       * mutation + dirty tracking. Keeping it separate also means the
       * admin can save geo changes without re-submitting the rest of
       * the settings form. */}
      {data ? <GeoScopeManager geo={data.geo} /> : null}
    </section>
  );
}
