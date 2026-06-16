import { z } from 'zod';
import { type ContactChannel, type InquiryStatus } from './enums';

/**
 * Per-property contact capabilities returned to the client.
 * Raw owner email/phone are NEVER included — only what each channel can do.
 */
export interface ContactCapabilities {
  chat: boolean;
  call: {
    enabled: boolean;
    /** When true the real number is proxied/masked. */
    masked: boolean;
  };
  whatsapp: boolean;
  email: boolean;
}

/** Owner-controlled visibility settings for a property's channels. */
export interface ContactPreferences {
  propertyId: string;
  channels: Record<ContactChannel, boolean>;
  maskPhone: boolean;
}

/** Email-relay inquiry — posted to POST /contact/inquiry. */
export const inquirySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20).optional(),
  message: z.string().min(10, 'Tell the owner a little more').max(1000),
  /** Spam protection — verified server-side. */
  captchaToken: z.string().min(1, 'Please complete the verification'),
  /** Communication consent — required, stored for audit. */
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required to contact the owner' }),
  }),
});
export type InquiryDto = z.infer<typeof inquirySchema>;

/** Click-to-call analytics event — no PII. */
export const callIntentSchema = z.object({
  propertyId: z.string().min(1),
  source: z.enum(['listing-card', 'detail-page']),
});
export type CallIntentDto = z.infer<typeof callIntentSchema>;

/** Request-a-callback flow with preferred time slots. */
export const callbackRequestSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  slots: z.array(z.string()).min(1).max(3),
  captchaToken: z.string().min(1),
  consent: z.literal(true),
});
export type CallbackRequestDto = z.infer<typeof callbackRequestSchema>;

/** WhatsApp deep-link request. */
export interface WhatsAppLinkResult {
  /** wa.me deep link with prefilled template, or null if disabled. */
  href: string | null;
  enabled: boolean;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  ownerId: string;
  channel: ContactChannel;
  status: InquiryStatus;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  slots?: string[];
  source?: 'listing-card' | 'detail-page';
  createdAt: string;
  updatedAt: string;
}

export const inquiryFiltersSchema = z.object({
  propertyId: z.string().optional(),
  channel: z.enum(['email', 'call', 'whatsapp', 'chat']).optional(),
  status: z.enum(['new', 'contacted', 'callback-requested', 'closed']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(24),
});
export type InquiryFilters = z.infer<typeof inquiryFiltersSchema>;

export const updateInquirySchema = z.object({
  status: z.enum(['new', 'contacted', 'callback-requested', 'closed']),
});
export type UpdateInquiryDto = z.infer<typeof updateInquirySchema>;

/* ─── Public general-contact form (admin recipients) ─────────────── */

export const CONTACT_TOPICS = [
  'General inquiry',
  'Sales',
  'Support',
  'Press',
  'Partnerships',
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const contactGeneralSchema = z.object({
  name: z.string().min(2, 'Please enter your full name.').max(80),
  email: z.string().email('Please enter a valid email.').max(200),
  topic: z.enum(CONTACT_TOPICS),
  message: z
    .string()
    .min(20, 'Tell us a little more — at least 20 characters.')
    .max(4000),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm consent to contact you.' }),
  }),
  captchaToken: z.string().min(1).max(4000),
});
export type ContactGeneralDto = z.infer<typeof contactGeneralSchema>;

export type ContactMessageStatus = 'new' | 'replied' | 'closed';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: ContactMessageStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessagePatchDto {
  status?: ContactMessageStatus;
  adminNote?: string;
}
