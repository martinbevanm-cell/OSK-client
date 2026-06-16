/**
 * Empty defaults for the public-facing contact block. The real values
 * come from `GET /settings` (admin-editable). These constants only
 * stand in when the backend is unreachable on the very first paint of
 * a fresh deploy — they're intentionally generic so a stale fallback
 * doesn't broadcast someone else's address.
 *
 * Every consumer must tolerate empty strings here and either hide the
 * surface or fall back gracefully.
 */
export const SITE_CONTACT = {
  companyName: 'OSK',
  email: '',
  phone: {
    /** Used for tel: links — digits and a leading + only. */
    tel: '',
    /** Used for display — keep the formatting humans expect. */
    display: '',
  },
  address: {
    line1: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
  },
} as const;

/** Compose a single-line address from whatever non-empty parts exist. */
export function formatAddressOneLine(): string {
  const a = SITE_CONTACT.address;
  return [
    a.line1,
    [a.city, a.region].filter(Boolean).join(', '),
    [a.postalCode, a.country].filter(Boolean).join(' '),
  ]
    .filter((s) => s.trim().length > 0)
    .join(', ');
}

/** Multi-line address rows for stacking in a <address> block. Empty
 *  rows are skipped so a partial config doesn't leave blank lines. */
export function addressLines(): string[] {
  const a = SITE_CONTACT.address;
  return [
    a.line1,
    [a.city, a.region].filter(Boolean).join(', '),
    [a.postalCode, a.country].filter(Boolean).join(' '),
  ].filter((s) => s.trim().length > 0);
}
