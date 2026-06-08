/**
 * Subscription contracts — mirror osk-backend/src/modules/subscriptions/.
 *
 * Two collections:
 *   - SubscriptionPlan: the catalog (Free / Gold / Premium etc.)
 *   - Subscription:     each user's current row
 */

import { z } from 'zod';
import { PROVIDER_KEYS } from './pricing.dto';

export const FEATURE_KEYS = [
  'agencyProfile',
  'agents',
  'submissions',
  'featured',
  'top',
  'urgent',
  'amenities',
  'nearestLocation',
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const PLAN_INTERVALS = ['month', 'year', 'one-time'] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export interface PlanPrice {
  currency: string;
  amount: number;
}

export interface PlanFeature {
  label: string;
  included: boolean;
  key?: FeatureKey;
  /** Numeric cap; null = unlimited; undefined = boolean feature. */
  limit?: number | null;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  prices: PlanPrice[];
  interval: PlanInterval;
  features: PlanFeature[];
  sortOrder: number;
  highlight: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SUBSCRIPTION_STATUSES = [
  'pending-payment',
  'active',
  'cancelled',
  'expired',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planSlug: string;
  status: SubscriptionStatus;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response shape from POST /subscriptions/subscribe. */
export interface SubscribeResult {
  subscription: Subscription;
  /** Only set when the plan is paid — frontend should follow it. */
  redirectUrl?: string;
  payment?: {
    id: string;
    provider: string;
    status: string;
  };
  /**
   * The (provider, currency, amount) the seller will actually be
   * charged. Echoed back so the UI can show "Billed at X Y" without
   * having to re-derive it. Absent for free plans.
   */
  billing?: {
    provider: (typeof PROVIDER_KEYS)[number];
    currency: string;
    amount: number;
  };
}

/* ─── admin input schemas ─────────────────────────────────────────── */

const priceSchema = z.object({
  currency: z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase()),
  amount: z.number().nonnegative(),
});

const featureSchema = z.object({
  label: z.string().min(1).max(80),
  included: z.boolean().default(true),
  key: z.enum(FEATURE_KEYS).optional(),
  limit: z.number().int().min(0).nullable().optional(),
});

export const createSubscriptionPlanSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(40),
  tagline: z.string().max(140).default(''),
  prices: z.array(priceSchema).default([]),
  interval: z.enum(PLAN_INTERVALS).default('month'),
  features: z.array(featureSchema).default([]),
  sortOrder: z.number().int().default(0),
  highlight: z.boolean().default(false),
  active: z.boolean().default(true),
});
export type CreateSubscriptionPlanDto = z.infer<typeof createSubscriptionPlanSchema>;
export const updateSubscriptionPlanSchema = createSubscriptionPlanSchema.partial();
export type UpdateSubscriptionPlanDto = z.infer<typeof updateSubscriptionPlanSchema>;

export interface SubscribeDto {
  planId: string;
  currency?: string;
  provider?: (typeof PROVIDER_KEYS)[number];
}
