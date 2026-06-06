/**
 * Central RTK Query cache-tag registry. Every feature API references tags
 * from this list so invalidation is consistent and discoverable.
 */
export const API_TAGS = [
  'Property',
  'PropertyList',
  'Agent',
  'AgentMetrics',
  'Inquiry',
  'Thread',
  'Message',
  'Review',
  'Notification',
  'SavedProperty',
  'User',
  'ContactPreference',
  'AdminOverview',
  'AuditLog',
  'SiteSettings',
  'PricingPlan',
  'PaymentSettings',
  'Payment',
] as const;

export type ApiTag = (typeof API_TAGS)[number];
