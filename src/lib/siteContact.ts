/**
 * Single source of truth for OSK's public-facing contact details. Every
 * surface that shows the address / phone / email pulls from here so a
 * future rebrand or HQ move is one diff, not twenty.
 */
export const SITE_CONTACT = {
  companyName: 'OSK',
  email: 'hello@osk.dev',
  phone: {
    /** Used for tel: links — digits and a leading + only. */
    tel: '+13659557829',
    /** Used for display — keep the formatting humans expect. */
    display: '+1 (365) 955-7829',
  },
  address: {
    line1: '101 Catherine Street, 6th Floor',
    city: 'Ottawa',
    region: 'Ontario',
    postalCode: 'K2P 2K9',
    country: 'Canada',
  },
} as const;

/** One-line address ("101 Catherine Street, 6th Floor, Ottawa, Ontario K2P 2K9, Canada"). */
export function formatAddressOneLine(): string {
  const a = SITE_CONTACT.address;
  return `${a.line1}, ${a.city}, ${a.region} ${a.postalCode}, ${a.country}`;
}

/** Multi-line address rows for stacking in a <address> block. */
export function addressLines(): string[] {
  const a = SITE_CONTACT.address;
  return [a.line1, `${a.city}, ${a.region} ${a.postalCode}`, a.country];
}
