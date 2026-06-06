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
  propertyId: string;
  userId: string;
  provider: ProviderKey;
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerRef?: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntentDto {
  propertyId: string;
  provider: ProviderKey;
}

/** Server response from POST /payments/intent. */
export interface CreateIntentResult {
  payment: Payment;
  /** Where to redirect the user to complete the charge. */
  redirectUrl: string;
}
