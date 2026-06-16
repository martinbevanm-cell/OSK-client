import type { ThemeName } from './enums';

export interface SiteSettingsContact {
  email: string;
  phoneTel: string;
  phoneDisplay: string;
  addressLine1: string;
  addressCity: string;
  addressRegion: string;
  addressPostalCode: string;
  addressCountry: string;
}

/**
 * URLs for the home page "Get the OSK App" poster. All optional; when
 * every field is empty the poster auto-hides.
 *  - appStoreUrl   → iOS App Store badge link
 *  - googlePlayUrl → Google Play badge link
 *  - appQrUrl      → target the QR code resolves to (smart-link / landing)
 */
export interface SiteSettingsAppLinks {
  appStoreUrl: string;
  googlePlayUrl: string;
  appQrUrl: string;
}

/**
 * Marketplace geographic scope. When mode is 'restricted', country
 * pickers across the app are filtered to `allowedCountries`, and the
 * backend's property-list endpoint silently scopes results to that
 * same set so even a direct API hit can't return excluded countries.
 */
export interface SiteSettingsGeo {
  mode: 'all' | 'restricted';
  /** ISO 3166-1 alpha-2, uppercase. */
  allowedCountries: string[];
}

export interface SiteSettingsStat {
  value: string;
  label: string;
}

export interface SiteSettingsLegal {
  privacyMarkdown: string;
  termsMarkdown: string;
  privacyUpdatedAt: string;
  termsUpdatedAt: string;
}

/** A single value/title pair used by the About page values cards
 *  and process steps. Edited per-row in the admin editor. */
export interface SiteSettingsAboutItem {
  title: string;
  body: string;
}

/** A trusted-partner tile on the home page. */
export interface SiteSettingsPartnerItem {
  name: string;
  role: string;
}

/** Editable copy for the home page "Trusted partners" strip. */
export interface SiteSettingsPartners {
  eyebrow: string;
  title: string;
  sub: string;
  items: SiteSettingsPartnerItem[];
}

/** Editable copy for the About page. Every visible string lives
 *  here so admins can rewrite the marketing without a deploy. */
export interface SiteSettingsAbout {
  header: {
    eyebrow: string;
    titlePrefix: string;
    titleEmphasis: string;
    lede: string;
  };
  values: {
    eyebrow: string;
    title: string;
    items: SiteSettingsAboutItem[];
  };
  process: {
    eyebrow: string;
    title: string;
    items: SiteSettingsAboutItem[];
  };
  cta: {
    title: string;
    body: string;
  };
}

/** Returned by GET /settings and PATCH /admin/settings. */
export interface SiteSettings {
  activeTheme: ThemeName;
  siteTitle: string;
  companyName: string;
  logoUrl: string;
  contact: SiteSettingsContact;
  appLinks: SiteSettingsAppLinks;
  geo: SiteSettingsGeo;
  homeStats: SiteSettingsStat[];
  legal: SiteSettingsLegal;
  about: SiteSettingsAbout;
  partners: SiteSettingsPartners;
  updatedAt: string;
}

export type SiteSettingsPatch = Partial<{
  activeTheme: ThemeName;
  siteTitle: string;
  companyName: string;
  logoUrl: string;
  contact: Partial<SiteSettingsContact>;
  appLinks: Partial<SiteSettingsAppLinks>;
  geo: Partial<SiteSettingsGeo>;
  homeStats: SiteSettingsStat[];
  legal: Partial<SiteSettingsLegal>;
  about: {
    header?: Partial<SiteSettingsAbout['header']>;
    values?: {
      eyebrow?: string;
      title?: string;
      items?: SiteSettingsAboutItem[];
    };
    process?: {
      eyebrow?: string;
      title?: string;
      items?: SiteSettingsAboutItem[];
    };
    cta?: Partial<SiteSettingsAbout['cta']>;
  };
  partners: {
    eyebrow?: string;
    title?: string;
    sub?: string;
    items?: SiteSettingsPartnerItem[];
  };
}>;
