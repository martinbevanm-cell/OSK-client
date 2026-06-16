'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  THEMES,
  type SiteSettingsAbout,
  type SiteSettingsAboutItem,
  type SiteSettingsLegal,
  type SiteSettings,
  type SiteSettingsPartners,
  type SiteSettingsPartnerItem,
  type SiteSettingsStat,
  type ThemeName,
} from '@contracts';
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from '@/features/settings';
import { revalidateSiteSettings } from '@/features/settings/actions';
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
  about: SiteSettingsAbout;
  partners: SiteSettingsPartners;
}

type SettingsTab = 'general' | 'legal' | 'about' | 'home';

const EMPTY_ABOUT: SiteSettingsAbout = {
  header: { eyebrow: '', titlePrefix: '', titleEmphasis: '', lede: '' },
  values: { eyebrow: '', title: '', items: [] },
  process: { eyebrow: '', title: '', items: [] },
  cta: { title: '', body: '' },
};

/**
 *  Fallback content shown in the admin editor when the deployed
 *  backend's settings doc has no `partners` field yet — must mirror
 *  the FALLBACK_PARTNERS constant in TrustedPartners.tsx so the
 *  admin sees the same content the public home page is rendering.
 *  After the first save, this is overwritten by the saved values
 *  the API returns.
 */
const FALLBACK_PARTNERS: SiteSettingsPartners = {
  eyebrow: 'Trusted partners',
  title: 'A network you can close with.',
  sub: 'From financing to the final inspection, OSK works with vetted local pros so every step of the move stays under one roof.',
  items: [
    { name: 'Atlas Mortgage', role: 'Mortgage broker' },
    { name: 'Liberty Title', role: 'Title insurance' },
    { name: 'Apex Inspections', role: 'Home inspection' },
    { name: 'First Federal Bank', role: 'Lender' },
    { name: 'Sterling Insure', role: 'Home insurance' },
    { name: 'Cornerstone Movers', role: 'Relocation' },
  ],
};

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
    about: s.about ?? EMPTY_ABOUT,
    /* Per-field fallback so the editor never shows empty inputs when
     * the deployed backend hasn't shipped the partners field yet OR
     * when the doc returns an empty items array. The first save
     * persists whatever's in the form, so the admin can use this as
     * a starting template and just tweak from there. */
    partners: {
      eyebrow: s.partners?.eyebrow?.trim()
        ? s.partners.eyebrow
        : FALLBACK_PARTNERS.eyebrow,
      title: s.partners?.title?.trim() ? s.partners.title : FALLBACK_PARTNERS.title,
      sub: s.partners?.sub?.trim() ? s.partners.sub : FALLBACK_PARTNERS.sub,
      items:
        s.partners?.items && s.partners.items.length > 0
          ? s.partners.items
          : FALLBACK_PARTNERS.items,
    },
  };
}

export function SettingsManager() {
  const dispatch = useAppDispatch();
  const router = useRouter();
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

  /* ─── About-tab helpers ──────────────────────────────────────────── */
  type AboutTextPath =
    | ['header', keyof SiteSettingsAbout['header']]
    | ['values', 'eyebrow' | 'title']
    | ['process', 'eyebrow' | 'title']
    | ['cta', keyof SiteSettingsAbout['cta']];

  const setAboutText = (path: AboutTextPath, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const about = { ...prev.about };
      const [section, key] = path;
      if (section === 'header') {
        about.header = { ...about.header, [key]: value };
      } else if (section === 'values') {
        about.values = { ...about.values, [key]: value };
      } else if (section === 'process') {
        about.process = { ...about.process, [key]: value };
      } else if (section === 'cta') {
        about.cta = { ...about.cta, [key]: value };
      }
      return { ...prev, about };
    });
  };

  const setAboutItem = (
    section: 'values' | 'process',
    index: number,
    key: keyof SiteSettingsAboutItem,
    value: string,
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = prev.about[section].items.map((it, i) =>
        i === index ? { ...it, [key]: value } : it,
      );
      const about = {
        ...prev.about,
        [section]: { ...prev.about[section], items },
      };
      return { ...prev, about };
    });
  };

  const addAboutItem = (section: 'values' | 'process') => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = [...prev.about[section].items, { title: '', body: '' }];
      const about = {
        ...prev.about,
        [section]: { ...prev.about[section], items },
      };
      return { ...prev, about };
    });
  };

  const removeAboutItem = (section: 'values' | 'process', index: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = prev.about[section].items.filter((_, i) => i !== index);
      const about = {
        ...prev.about,
        [section]: { ...prev.about[section], items },
      };
      return { ...prev, about };
    });
  };

  /* ─── Home-tab helpers (partners) ──────────────────────────────── */
  const setPartnerText = (key: 'eyebrow' | 'title' | 'sub', value: string) => {
    setForm((prev) =>
      prev ? { ...prev, partners: { ...prev.partners, [key]: value } } : prev,
    );
  };

  const setPartnerItem = (
    index: number,
    key: keyof SiteSettingsPartnerItem,
    value: string,
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = prev.partners.items.map((it, i) =>
        i === index ? { ...it, [key]: value } : it,
      );
      return { ...prev, partners: { ...prev.partners, items } };
    });
  };

  const addPartnerItem = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = [...prev.partners.items, { name: '', role: '' }];
      return { ...prev, partners: { ...prev.partners, items } };
    });
  };

  const removePartnerItem = (index: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const items = prev.partners.items.filter((_, i) => i !== index);
      return { ...prev, partners: { ...prev.partners, items } };
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
        about: form.about,
        partners: form.partners,
      }).unwrap();
      const next = fromSettings(saved);
      setForm(next);
      setInitialForm(next);
      /* Burn Next's data cache for the /settings endpoint so the
       * Footer (RSC) and any other server-rendered consumer pull
       * the fresh contact details. Belt-and-suspenders:
       *  1) revalidateTag('site-settings') marks the cached fetch
       *     as stale so the NEXT render hits the API again.
       *  2) revalidatePath('/', 'layout') invalidates every nested
       *     route's RSC tree.
       *  3) router.refresh() forces THIS tab to re-render its
       *     server components in place, so the Footer updates
       *     without the admin needing to navigate or hard-refresh.
       * Fire-and-forget; if the action throws the toast still says
       * success because the write already landed in Mongo. */
      try {
        await revalidateSiteSettings();
      } catch {
        /* non-fatal */
      }
      router.refresh();
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
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'about'}
          className={cn(styles.tab, activeTab === 'about' && styles.tabActive)}
          onClick={() => setActiveTab('about')}
        >
          About page
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'home'}
          className={cn(styles.tab, activeTab === 'home' && styles.tabActive)}
          onClick={() => setActiveTab('home')}
        >
          Home page
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
                  hint="What humans see — e.g. +1 (555) 123-4567"
                  required
                />
              </div>
              <TextField
                label="Phone (tel: link)"
                value={form.phoneTel}
                onChange={(e) => setField('phoneTel', e.target.value)}
                hint="Digits and a leading + only — e.g. +15551234567"
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
        ) : activeTab === 'legal' ? (
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
        ) : activeTab === 'about' ? (
          /* ── About page ───────────────────────────────────────────── */
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Header</h2>
              <p className={styles.sectionHint}>
                The eyebrow, title and intro paragraph at the top of the About page. Use{' '}
                <code>{`{companyName}`}</code> anywhere — it&rsquo;s replaced at render
                time with whatever you set under General.
              </p>
              <div className={styles.grid2}>
                <TextField
                  label="Eyebrow"
                  value={form.about.header.eyebrow}
                  onChange={(e) => setAboutText(['header', 'eyebrow'], e.target.value)}
                  placeholder="About {companyName}"
                />
                <TextField
                  label="Title (prefix)"
                  value={form.about.header.titlePrefix}
                  onChange={(e) =>
                    setAboutText(['header', 'titlePrefix'], e.target.value)
                  }
                  placeholder="A better way to"
                />
                <TextField
                  label="Title (emphasised)"
                  value={form.about.header.titleEmphasis}
                  onChange={(e) =>
                    setAboutText(['header', 'titleEmphasis'], e.target.value)
                  }
                  hint="Rendered in italic as the highlighted phrase."
                  placeholder="find a home."
                />
              </div>
              <label className={styles.textareaField}>
                <span className={styles.fieldLabel}>Lede paragraph</span>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={form.about.header.lede}
                  onChange={(e) => setAboutText(['header', 'lede'], e.target.value)}
                  maxLength={1000}
                />
              </label>
            </div>

            {/* ── Stats strip ─────────────────────────────────────────
             *  This is the four-tile row rendered just under the page
             *  header (12,400+ Curated listings, etc.). It's the same
             *  `homeStats` field that drives the home page's trust
             *  strip — editing it here updates both surfaces. Exposed
             *  in this tab too so the admin can edit every visible
             *  About section without tab-hopping. */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Stats strip</h2>
              <p className={styles.sectionHint}>
                The four-tile row under the About-page header — also shown on the home
                page. Use short, scannable values (&ldquo;12,400+&rdquo;,
                &ldquo;$3.2B&rdquo;). Leave a slot blank to hide that tile.
              </p>
              <div className={styles.grid2}>
                {form.homeStats.map((stat, i) => (
                  <div key={i} className={styles.statRow}>
                    <TextField
                      label={`Tile ${i + 1} — value`}
                      value={stat.value}
                      maxLength={24}
                      placeholder="12,400+"
                      onChange={(e) => setHomeStat(i, 'value', e.target.value)}
                    />
                    <TextField
                      label={`Tile ${i + 1} — label`}
                      value={stat.label}
                      maxLength={40}
                      placeholder="Curated listings"
                      onChange={(e) => setHomeStat(i, 'label', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <AboutItemList
              section="values"
              eyebrow={form.about.values.eyebrow}
              title={form.about.values.title}
              items={form.about.values.items}
              setAboutText={setAboutText}
              setAboutItem={setAboutItem}
              addAboutItem={addAboutItem}
              removeAboutItem={removeAboutItem}
              sectionLabel="Values"
              sectionHint='"What we believe" cards. Add as many as you want — the page renders them in order.'
            />

            <AboutItemList
              section="process"
              eyebrow={form.about.process.eyebrow}
              title={form.about.process.title}
              items={form.about.process.items}
              setAboutText={setAboutText}
              setAboutItem={setAboutItem}
              addAboutItem={addAboutItem}
              removeAboutItem={removeAboutItem}
              sectionLabel="How it works"
              sectionHint="Numbered steps shown under the values cards. Four works best in the grid; fewer is fine."
            />

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Call-to-action</h2>
              <p className={styles.sectionHint}>
                The box at the bottom of the page that links to the Start-a-listing flow.
              </p>
              <TextField
                label="Title"
                value={form.about.cta.title}
                onChange={(e) => setAboutText(['cta', 'title'], e.target.value)}
                placeholder="List a property with {companyName}"
              />
              <label className={styles.textareaField}>
                <span className={styles.fieldLabel}>Body</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.about.cta.body}
                  onChange={(e) => setAboutText(['cta', 'body'], e.target.value)}
                  maxLength={1000}
                />
              </label>
            </div>
          </>
        ) : activeTab === 'home' ? (
          <>
            {/* Home page tab. Currently scopes to the "Trusted
                partners" strip. Other home-page sections (Hero,
                CityShowcase, etc.) can layer into this tab later. */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Trusted partners</h2>
              <p className={styles.sectionHint}>
                The partner strip on the home page. Add as many partners as you want —
                they render in order.
              </p>
              <div className={styles.grid2}>
                <TextField
                  label="Eyebrow"
                  value={form.partners.eyebrow}
                  maxLength={80}
                  placeholder="Trusted partners"
                  onChange={(e) => setPartnerText('eyebrow', e.target.value)}
                />
                <TextField
                  label="Heading"
                  value={form.partners.title}
                  maxLength={160}
                  placeholder="A network you can close with."
                  onChange={(e) => setPartnerText('title', e.target.value)}
                />
              </div>
              <label className={styles.textareaField}>
                <span className={styles.fieldLabel}>Sub-paragraph</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.partners.sub}
                  onChange={(e) => setPartnerText('sub', e.target.value)}
                  maxLength={1000}
                />
              </label>

              <div className={styles.repeaterList}>
                {form.partners.items.map((item, i) => (
                  <div key={i} className={styles.repeaterRow}>
                    <div className={styles.repeaterIndex} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className={styles.repeaterFields}>
                      <TextField
                        label="Partner name"
                        value={item.name}
                        maxLength={120}
                        placeholder="Atlas Mortgage"
                        onChange={(e) => setPartnerItem(i, 'name', e.target.value)}
                      />
                      <TextField
                        label="Role"
                        value={item.role}
                        maxLength={160}
                        placeholder="Mortgage broker"
                        onChange={(e) => setPartnerItem(i, 'role', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.repeaterRemove}
                      onClick={() => removePartnerItem(i)}
                      aria-label={`Remove partner ${i + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="secondary" onClick={addPartnerItem}>
                + Add partner
              </Button>
            </div>
          </>
        ) : null}

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

/* ─────────────────────────────────────────────────────────────────
 * Repeater used for both the Values and How-it-works sections of the
 * About page editor. Keeps the markup identical so the admin learns
 * one pattern; only the labels change.
 * ──────────────────────────────────────────────────────────────── */
type AboutTextPathArg =
  | ['header', keyof SiteSettingsAbout['header']]
  | ['values', 'eyebrow' | 'title']
  | ['process', 'eyebrow' | 'title']
  | ['cta', keyof SiteSettingsAbout['cta']];

interface AboutItemListProps {
  section: 'values' | 'process';
  sectionLabel: string;
  sectionHint: string;
  eyebrow: string;
  title: string;
  items: SiteSettingsAboutItem[];
  setAboutText: (path: AboutTextPathArg, value: string) => void;
  setAboutItem: (
    section: 'values' | 'process',
    index: number,
    key: keyof SiteSettingsAboutItem,
    value: string,
  ) => void;
  addAboutItem: (section: 'values' | 'process') => void;
  removeAboutItem: (section: 'values' | 'process', index: number) => void;
}

function AboutItemList({
  section,
  sectionLabel,
  sectionHint,
  eyebrow,
  title,
  items,
  setAboutText,
  setAboutItem,
  addAboutItem,
  removeAboutItem,
}: AboutItemListProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionLabel}</h2>
      <p className={styles.sectionHint}>{sectionHint}</p>

      <div className={styles.grid2}>
        <TextField
          label="Section eyebrow"
          value={eyebrow}
          onChange={(e) => setAboutText([section, 'eyebrow'], e.target.value)}
          placeholder={section === 'values' ? 'What we believe' : 'How it works'}
        />
        <TextField
          label="Section title"
          value={title}
          onChange={(e) => setAboutText([section, 'title'], e.target.value)}
          placeholder={
            section === 'values'
              ? 'Three things shape every page'
              : 'Four quiet steps from search to move-in'
          }
        />
      </div>

      <div className={styles.repeaterList}>
        {items.map((item, i) => (
          <div key={i} className={styles.repeaterRow}>
            <div className={styles.repeaterIndex} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className={styles.repeaterFields}>
              <TextField
                label="Heading"
                value={item.title}
                onChange={(e) => setAboutItem(section, i, 'title', e.target.value)}
              />
              <label className={styles.textareaField}>
                <span className={styles.fieldLabel}>Body</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={item.body}
                  onChange={(e) => setAboutItem(section, i, 'body', e.target.value)}
                  maxLength={2000}
                />
              </label>
            </div>
            <button
              type="button"
              className={styles.repeaterRemove}
              onClick={() => removeAboutItem(section, i)}
              aria-label={`Remove ${section} item ${i + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={() => addAboutItem(section)}>
        + Add {section === 'values' ? 'value' : 'step'}
      </Button>
    </div>
  );
}
