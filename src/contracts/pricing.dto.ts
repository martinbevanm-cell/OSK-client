import { z } from 'zod';
import { LISTING_KINDS, PROPERTY_TYPES } from './enums';

/* ─────────────────────────────────────────────────────────────────────
 * Pricing contracts — must mirror osk-backend/src/modules/pricing/.
 *
 * A PricingPlan maps (propertyType, listingKind, country, featured)
 * to a price + currency. Each axis admits '*' as a wildcard so admins
 * can write broad fallbacks alongside fine-grained rules.
 * ──────────────────────────────────────────────────────────────────── */

export const PLAN_WILDCARD = '*' as const;

export const PROVIDER_KEYS = [
  'stripe',
  'paypal',
  'paystack',
  'bank-transfer',
] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  paystack: 'Paystack',
  'bank-transfer': 'Bank transfer',
};

export type PlanPropertyType = (typeof PROPERTY_TYPES)[number] | '*';
export type PlanListingKind = (typeof LISTING_KINDS)[number] | '*';

export interface PricingPlan {
  id: string;
  name: string;
  propertyType: PlanPropertyType;
  listingKind: PlanListingKind;
  /** ISO-2 uppercased country code or '*' for any. */
  country: string;
  /** True when this plan is the price for the featured upgrade. */
  featured: boolean;
  price: number;
  currency: string;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Per-field credential status the admin sees. The backend NEVER ships
 * the raw secret — only a `configured` flag plus a masked hint so the
 * admin can confirm which key is set without exposing it.
 */
export interface MaskedSecretField {
  configured: boolean;
  /** Bullets + last 4 of the saved value, e.g. "•••• 4242". */
  hint: string;
}

export interface ProviderCredentialsStatus {
  stripe: {
    secretKey: MaskedSecretField;
    webhookSecret: MaskedSecretField;
  };
  paypal: {
    clientId: MaskedSecretField;
    clientSecret: MaskedSecretField;
    webhookId: MaskedSecretField;
    /** Plain — sandbox vs live REST host, not a secret. */
    apiBase: string;
  };
  paystack: {
    secretKey: MaskedSecretField;
  };
}

export interface PaymentSettings {
  paymentsEnabled: boolean;
  enabledProviders: ProviderKey[];
  bankInstructions: string;
  providers: ProviderCredentialsStatus;
}

export interface ResolvedPrice {
  base: { amount: number; currency: string; planId: string | null };
  featured:
    | { amount: number; currency: string; planId: string | null }
    | null;
  paymentsEnabled: boolean;
  total: number;
  currency: string;
}

/* ─── input schemas (admin forms) ───────────────────────────────────── */

const planPropertyType = z.union([z.enum(PROPERTY_TYPES), z.literal('*')]);
const planListingKind = z.union([z.enum(LISTING_KINDS), z.literal('*')]);

export const createPricingPlanSchema = z.object({
  name: z.string().min(2).max(80),
  propertyType: planPropertyType.default('*'),
  listingKind: planListingKind.default('*'),
  country: z
    .string()
    .min(1)
    .max(2)
    .transform((v) => v.toUpperCase()),
  featured: z.boolean().default(false),
  price: z.number().nonnegative(),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase()),
  priority: z.number().int().default(0),
  active: z.boolean().default(true),
});
export type CreatePricingPlanDto = z.infer<typeof createPricingPlanSchema>;

export const updatePricingPlanSchema = createPricingPlanSchema.partial();
export type UpdatePricingPlanDto = z.infer<typeof updatePricingPlanSchema>;

/* Per-provider credential patches — admin sends raw values, backend
 * encrypts them before storing. Every field is optional; '' clears. */
const secretField = z.string().max(512).optional();

const stripeCredentialsPatch = z
  .object({
    secretKey: secretField,
    webhookSecret: secretField,
  })
  .partial();

const paypalCredentialsPatch = z
  .object({
    clientId: secretField,
    clientSecret: secretField,
    apiBase: z
      .string()
      .url()
      .max(200)
      .optional()
      .or(z.literal('')),
    webhookId: secretField,
  })
  .partial();

const paystackCredentialsPatch = z
  .object({
    secretKey: secretField,
  })
  .partial();

export const updatePaymentSettingsSchema = z.object({
  paymentsEnabled: z.boolean().optional(),
  enabledProviders: z.array(z.enum(PROVIDER_KEYS)).optional(),
  bankInstructions: z.string().max(2000).optional(),
  stripe: stripeCredentialsPatch.optional(),
  paypal: paypalCredentialsPatch.optional(),
  paystack: paystackCredentialsPatch.optional(),
});
export type UpdatePaymentSettingsDto = z.infer<
  typeof updatePaymentSettingsSchema
>;
