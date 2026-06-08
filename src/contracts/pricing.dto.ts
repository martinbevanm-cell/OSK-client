import { z } from 'zod';

/* ─────────────────────────────────────────────────────────────────────
 * Pricing contracts — must mirror osk-backend/src/modules/pricing/.
 *
 * After moving to a subscription model, this contract is purely about
 * the operator's payment configuration: master toggle, enabled
 * providers, encrypted provider credentials, bank-transfer
 * instructions. Per-listing pricing plans have been removed in favour
 * of subscription plans (see `contracts/subscription.dto.ts`).
 * ──────────────────────────────────────────────────────────────────── */

export const PROVIDER_KEYS = ['stripe', 'paypal', 'paystack', 'bank-transfer'] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  paystack: 'Paystack',
  'bank-transfer': 'Bank transfer',
};

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
  /**
   * Computed server-side — true when each provider has the minimum
   * credentials it needs to actually charge money. Drives the
   * "Active / Needs setup" badge in the admin UI.
   */
  providerReady: Record<ProviderKey, boolean>;
  /**
   * The billing currencies each provider can charge in. Drives the
   * checkout picker so users only see valid (provider, currency)
   * options — no impossible combos. Read-only platform constant.
   */
  providerBillingCurrencies: Record<ProviderKey, readonly string[]>;
  /** Union of every supported billing currency. */
  billingCurrencies: readonly string[];
}

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
    apiBase: z.string().url().max(200).optional().or(z.literal('')),
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
export type UpdatePaymentSettingsDto = z.infer<typeof updatePaymentSettingsSchema>;
