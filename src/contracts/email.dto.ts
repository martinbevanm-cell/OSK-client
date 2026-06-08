import { z } from 'zod';
import type { MaskedSecretField } from './pricing.dto';

/**
 * Email-settings contracts — mirror osk-backend/src/modules/email/.
 *
 * The platform supports three providers: a no-op console adapter
 * (logs only, default), Resend (HTTPS-only API, recommended for
 * Railway / Vercel deployments) and SMTP (any nodemailer-compatible
 * host). All credentials are encrypted at rest by the backend.
 */

export const EMAIL_PROVIDER_KEYS = ['console', 'resend', 'smtp'] as const;
export type EmailProviderKey = (typeof EMAIL_PROVIDER_KEYS)[number];

export const EMAIL_PROVIDER_LABELS: Record<EmailProviderKey, string> = {
  console: 'Console (logs only — no real send)',
  resend: 'Resend',
  smtp: 'SMTP (advanced)',
};

export interface EmailSettings {
  provider: EmailProviderKey;
  fromAddress: string;
  fromName: string;
  resend: {
    apiKey: MaskedSecretField;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: MaskedSecretField;
  };
  /** True when the selected provider has the minimum config to send. */
  ready: boolean;
}

/* ─── patch schema ─────────────────────────────────────────────────── */

const secretField = z.string().max(512).optional();

const resendPatch = z
  .object({
    apiKey: secretField,
  })
  .partial();

const smtpPatch = z
  .object({
    host: z.string().max(200).optional(),
    port: z.number().int().min(1).max(65535).optional(),
    secure: z.boolean().optional(),
    user: z.string().max(200).optional(),
    password: secretField,
  })
  .partial();

export const updateEmailSettingsSchema = z.object({
  provider: z.enum(EMAIL_PROVIDER_KEYS).optional(),
  fromAddress: z.string().email().max(200).optional().or(z.literal('')),
  fromName: z.string().max(80).optional(),
  resend: resendPatch.optional(),
  smtp: smtpPatch.optional(),
});
export type UpdateEmailSettingsDto = z.infer<typeof updateEmailSettingsSchema>;

export const sendTestEmailSchema = z.object({
  to: z.string().email().max(200),
});
export type SendTestEmailDto = z.infer<typeof sendTestEmailSchema>;
