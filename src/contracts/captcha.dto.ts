/**
 * Captcha contracts. The public config is what the signup form uses
 * to decide whether to mount the widget; the admin DTO is for the
 * settings page.
 */

export const CAPTCHA_PROVIDER_KEYS = ['none', 'turnstile', 'local'] as const;
export type CaptchaProvider = (typeof CAPTCHA_PROVIDER_KEYS)[number];

export const CAPTCHA_PROVIDER_LABELS: Record<CaptchaProvider, string> = {
  none: 'Disabled (no captcha)',
  turnstile: 'Cloudflare Turnstile',
  local: 'Built-in text captcha',
};

/** Payload of GET /captcha/challenge — token + inline SVG markup. */
export interface CaptchaChallenge {
  token: string;
  svg: string;
}

import type { MaskedSecretField } from './pricing.dto';

export interface CaptchaSettingsDTO {
  provider: CaptchaProvider;
  siteKey: string;
  secret: MaskedSecretField;
  /** True when provider != 'none' AND siteKey + decrypted secret are both present. */
  ready: boolean;
}

/** What the public `/captcha/config` endpoint returns. */
export interface CaptchaPublicConfig {
  provider: CaptchaProvider;
  siteKey: string;
  /** True when the backend will actually verify tokens. When false, the
   *  signup form can submit without rendering the widget. */
  enabled: boolean;
}

/** Admin patch payload — every field optional so partial saves are easy. */
export interface UpdateCaptchaSettingsDto {
  provider?: CaptchaProvider;
  siteKey?: string;
  /** Plain-text secret on the way in; the backend encrypts at rest. Omit
   *  to leave the existing secret unchanged. */
  secretKey?: string;
}
