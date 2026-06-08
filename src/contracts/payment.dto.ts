import type { ProviderKey } from './pricing.dto';

export const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Payment {
  id: string;
  /** Empty string when this payment is for a subscription rather than
   *  a specific listing. */
  propertyId: string;
  /** Set when this payment activates / renews a subscription. */
  subscriptionId: string | null;
  userId: string;
  provider: ProviderKey;
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerRef?: string;
  metadata: Record<string, string>;
  /** Bank-transfer proof screenshot URL, when uploaded. */
  proofUrl?: string;
  /** ISO timestamp the proof was uploaded. */
  proofUploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}
