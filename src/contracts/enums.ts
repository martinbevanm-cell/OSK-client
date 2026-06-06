/** Domain enumerations shared across the API contract. */

export const PROPERTY_TYPES = ['home', 'plot', 'commercial', 'rental'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_KINDS = ['new-project', 'resale'] as const;
export type ListingKind = (typeof LISTING_KINDS)[number];

export const PROPERTY_STATUSES = [
  'draft',
  'pending-review',
  'approved',
  /** Approved but parked until the seller completes payment. */
  'awaiting-payment',
  'rejected',
  'published',
  'sold',
  'archived',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const USER_ROLES = ['buyer', 'seller', 'agent', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles that can self-register (admin is provisioned, never self-served). */
export const REGISTRABLE_ROLES = ['buyer', 'seller', 'agent'] as const;
export type RegistrableRole = (typeof REGISTRABLE_ROLES)[number];

export const CONTACT_CHANNELS = ['chat', 'call', 'whatsapp', 'email'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const INQUIRY_STATUSES = [
  'new',
  'contacted',
  'callback-requested',
  'closed',
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const THEMES = [
  'theme-luxe-light',
  'theme-luxe-dark',
  'theme-emerald',
  'theme-sandstone',
] as const;
export type ThemeName = (typeof THEMES)[number];
