/**
 * US-focused filter data for the hero search bar.
 *
 * Kept in a plain data file (no JSX) so the hero filter panels stay
 * presentational and the same lists are reusable by other surfaces
 * (full-results filter sidebar, mobile sheet, agent dashboard).
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Listing intent — the top tabs of the search bar.
 * Maps to the property listing route + a query-string `intent` parameter.
 * ──────────────────────────────────────────────────────────────────────── */

export const LISTING_INTENTS = [
  { id: 'buy', label: 'Buy', route: '/buy', helper: 'Find your next home' },
  { id: 'rent', label: 'Rent', route: '/rent', helper: 'Rentals across the U.S.' },
  {
    id: 'new-projects',
    label: 'New Projects',
    route: '/new-projects',
    helper: 'Newly built developments',
  },
] as const;

export type ListingIntent = (typeof LISTING_INTENTS)[number]['id'];

/* ─────────────────────────────────────────────────────────────────────────
 * Property type groups → sub-categories.
 * Aligns with the backend PROPERTY_TYPES enum: each sub-category carries
 * the canonical `type` so the search submit can fan out into a typed query.
 * ──────────────────────────────────────────────────────────────────────── */

export type PropertyKind = 'home' | 'plot' | 'commercial' | 'rental';

export interface PropertySubCategory {
  id: string;
  label: string;
  type: PropertyKind;
}

export interface PropertyCategory {
  id: string;
  label: string;
  description: string;
  type: PropertyKind;
  subcategories: PropertySubCategory[];
}

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  {
    id: 'homes',
    label: 'Homes',
    description: 'Single family, condos, townhouses & more',
    type: 'home',
    subcategories: [
      { id: 'single-family', label: 'Single Family', type: 'home' },
      { id: 'condo', label: 'Condo', type: 'home' },
      { id: 'townhouse', label: 'Townhouse', type: 'home' },
      { id: 'multi-family', label: 'Multi-Family', type: 'home' },
      { id: 'apartment', label: 'Apartment', type: 'home' },
      { id: 'manufactured', label: 'Manufactured', type: 'home' },
      { id: 'co-op', label: 'Co-op', type: 'home' },
    ],
  },
  {
    id: 'plots',
    label: 'Plots & Land',
    description: 'Lots, acreage, agricultural & build-ready land',
    type: 'plot',
    subcategories: [
      { id: 'residential-lot', label: 'Residential Lot', type: 'plot' },
      { id: 'commercial-lot', label: 'Commercial Lot', type: 'plot' },
      { id: 'agricultural', label: 'Agricultural', type: 'plot' },
      { id: 'industrial-land', label: 'Industrial Land', type: 'plot' },
      { id: 'recreational', label: 'Recreational', type: 'plot' },
      { id: 'waterfront-lot', label: 'Waterfront Lot', type: 'plot' },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    description: 'Office, retail, industrial & hospitality',
    type: 'commercial',
    subcategories: [
      { id: 'office', label: 'Office', type: 'commercial' },
      { id: 'retail', label: 'Retail', type: 'commercial' },
      { id: 'warehouse', label: 'Warehouse', type: 'commercial' },
      { id: 'industrial', label: 'Industrial', type: 'commercial' },
      { id: 'hospitality', label: 'Hospitality', type: 'commercial' },
      { id: 'medical', label: 'Medical', type: 'commercial' },
      { id: 'mixed-use', label: 'Mixed-Use', type: 'commercial' },
    ],
  },
  {
    id: 'rentals',
    label: 'Rentals',
    description: 'Apartments, houses & short-term stays',
    type: 'rental',
    subcategories: [
      { id: 'apartment-rental', label: 'Apartment', type: 'rental' },
      { id: 'house-rental', label: 'House', type: 'rental' },
      { id: 'condo-rental', label: 'Condo', type: 'rental' },
      { id: 'townhouse-rental', label: 'Townhouse', type: 'rental' },
      { id: 'room', label: 'Room / Roommate', type: 'rental' },
      { id: 'short-term', label: 'Short-Term', type: 'rental' },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * U.S. cities — top metros, alphabetised. Searchable + scrollable.
 * ──────────────────────────────────────────────────────────────────────── */

export interface USCity {
  id: string;
  name: string;
  state: string; // 2-letter postal code
  metro?: string;
}

export const US_CITIES: USCity[] = [
  { id: 'albuquerque-nm', name: 'Albuquerque', state: 'NM' },
  { id: 'anaheim-ca', name: 'Anaheim', state: 'CA' },
  { id: 'anchorage-ak', name: 'Anchorage', state: 'AK' },
  { id: 'arlington-tx', name: 'Arlington', state: 'TX' },
  { id: 'atlanta-ga', name: 'Atlanta', state: 'GA' },
  { id: 'aurora-co', name: 'Aurora', state: 'CO' },
  { id: 'austin-tx', name: 'Austin', state: 'TX' },
  { id: 'bakersfield-ca', name: 'Bakersfield', state: 'CA' },
  { id: 'baltimore-md', name: 'Baltimore', state: 'MD' },
  { id: 'boise-id', name: 'Boise', state: 'ID' },
  { id: 'boston-ma', name: 'Boston', state: 'MA' },
  { id: 'buffalo-ny', name: 'Buffalo', state: 'NY' },
  { id: 'charlotte-nc', name: 'Charlotte', state: 'NC' },
  { id: 'chicago-il', name: 'Chicago', state: 'IL' },
  { id: 'cincinnati-oh', name: 'Cincinnati', state: 'OH' },
  { id: 'cleveland-oh', name: 'Cleveland', state: 'OH' },
  { id: 'colorado-springs-co', name: 'Colorado Springs', state: 'CO' },
  { id: 'columbus-oh', name: 'Columbus', state: 'OH' },
  { id: 'dallas-tx', name: 'Dallas', state: 'TX' },
  { id: 'denver-co', name: 'Denver', state: 'CO' },
  { id: 'detroit-mi', name: 'Detroit', state: 'MI' },
  { id: 'el-paso-tx', name: 'El Paso', state: 'TX' },
  { id: 'fort-worth-tx', name: 'Fort Worth', state: 'TX' },
  { id: 'fresno-ca', name: 'Fresno', state: 'CA' },
  { id: 'honolulu-hi', name: 'Honolulu', state: 'HI' },
  { id: 'houston-tx', name: 'Houston', state: 'TX' },
  { id: 'indianapolis-in', name: 'Indianapolis', state: 'IN' },
  { id: 'jacksonville-fl', name: 'Jacksonville', state: 'FL' },
  { id: 'kansas-city-mo', name: 'Kansas City', state: 'MO' },
  { id: 'las-vegas-nv', name: 'Las Vegas', state: 'NV' },
  { id: 'long-beach-ca', name: 'Long Beach', state: 'CA' },
  { id: 'los-angeles-ca', name: 'Los Angeles', state: 'CA' },
  { id: 'louisville-ky', name: 'Louisville', state: 'KY' },
  { id: 'memphis-tn', name: 'Memphis', state: 'TN' },
  { id: 'mesa-az', name: 'Mesa', state: 'AZ' },
  { id: 'miami-fl', name: 'Miami', state: 'FL' },
  { id: 'milwaukee-wi', name: 'Milwaukee', state: 'WI' },
  { id: 'minneapolis-mn', name: 'Minneapolis', state: 'MN' },
  { id: 'nashville-tn', name: 'Nashville', state: 'TN' },
  { id: 'new-orleans-la', name: 'New Orleans', state: 'LA' },
  { id: 'new-york-ny', name: 'New York', state: 'NY' },
  { id: 'oakland-ca', name: 'Oakland', state: 'CA' },
  { id: 'oklahoma-city-ok', name: 'Oklahoma City', state: 'OK' },
  { id: 'omaha-ne', name: 'Omaha', state: 'NE' },
  { id: 'orlando-fl', name: 'Orlando', state: 'FL' },
  { id: 'philadelphia-pa', name: 'Philadelphia', state: 'PA' },
  { id: 'phoenix-az', name: 'Phoenix', state: 'AZ' },
  { id: 'pittsburgh-pa', name: 'Pittsburgh', state: 'PA' },
  { id: 'portland-or', name: 'Portland', state: 'OR' },
  { id: 'raleigh-nc', name: 'Raleigh', state: 'NC' },
  { id: 'sacramento-ca', name: 'Sacramento', state: 'CA' },
  { id: 'salt-lake-city-ut', name: 'Salt Lake City', state: 'UT' },
  { id: 'san-antonio-tx', name: 'San Antonio', state: 'TX' },
  { id: 'san-diego-ca', name: 'San Diego', state: 'CA' },
  { id: 'san-francisco-ca', name: 'San Francisco', state: 'CA' },
  { id: 'san-jose-ca', name: 'San Jose', state: 'CA' },
  { id: 'seattle-wa', name: 'Seattle', state: 'WA' },
  { id: 'st-louis-mo', name: 'St. Louis', state: 'MO' },
  { id: 'tampa-fl', name: 'Tampa', state: 'FL' },
  { id: 'tucson-az', name: 'Tucson', state: 'AZ' },
  { id: 'tulsa-ok', name: 'Tulsa', state: 'OK' },
  { id: 'virginia-beach-va', name: 'Virginia Beach', state: 'VA' },
  { id: 'washington-dc', name: 'Washington', state: 'DC' },
  { id: 'wichita-ks', name: 'Wichita', state: 'KS' },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Price presets (USD). Two scales — purchase vs. rent.
 * `null` means "no upper / lower bound" so we render "Any" in the UI.
 * ──────────────────────────────────────────────────────────────────────── */

export interface RangePreset {
  label: string;
  value: number | null;
}

export const PRICE_PRESETS_BUY: RangePreset[] = [
  { label: 'Any', value: null },
  { label: '$100k', value: 100_000 },
  { label: '$200k', value: 200_000 },
  { label: '$300k', value: 300_000 },
  { label: '$400k', value: 400_000 },
  { label: '$500k', value: 500_000 },
  { label: '$750k', value: 750_000 },
  { label: '$1M', value: 1_000_000 },
  { label: '$1.5M', value: 1_500_000 },
  { label: '$2M', value: 2_000_000 },
  { label: '$3M', value: 3_000_000 },
  { label: '$5M', value: 5_000_000 },
  { label: '$10M', value: 10_000_000 },
];

export const PRICE_PRESETS_RENT: RangePreset[] = [
  { label: 'Any', value: null },
  { label: '$500', value: 500 },
  { label: '$1,000', value: 1_000 },
  { label: '$1,500', value: 1_500 },
  { label: '$2,000', value: 2_000 },
  { label: '$2,500', value: 2_500 },
  { label: '$3,000', value: 3_000 },
  { label: '$4,000', value: 4_000 },
  { label: '$5,000', value: 5_000 },
  { label: '$7,500', value: 7_500 },
  { label: '$10,000', value: 10_000 },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Area presets (sq ft). Same shape as price.
 * ──────────────────────────────────────────────────────────────────────── */

export const AREA_PRESETS_SQFT: RangePreset[] = [
  { label: 'Any', value: null },
  { label: '500', value: 500 },
  { label: '750', value: 750 },
  { label: '1,000', value: 1_000 },
  { label: '1,250', value: 1_250 },
  { label: '1,500', value: 1_500 },
  { label: '2,000', value: 2_000 },
  { label: '2,500', value: 2_500 },
  { label: '3,000', value: 3_000 },
  { label: '4,000', value: 4_000 },
  { label: '5,000', value: 5_000 },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Bedroom / bathroom presets for the "More" panel.
 * ──────────────────────────────────────────────────────────────────────── */

export const BEDS_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Studio', value: 0 },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
];

export const BATHS_OPTIONS = [
  { label: 'Any', value: null },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Format helpers — currency + sq ft. Pure functions so they can be unit-tested.
 * ──────────────────────────────────────────────────────────────────────── */

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatUSD = (value: number): string => USD.format(value);

/** Compact dollar label — $1.2M / $750K / $2,400. */
export function formatUSDCompact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return USD.format(value);
}

/**
 * Country-aware compact price label. Same scale as `formatUSDCompact` but
 * the leading symbol comes from the active country's currency.
 *
 * Example: `formatPriceCompact(1500000, '€')` → `€1.5M`.
 */
export function formatPriceCompact(value: number, symbol = '$'): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${symbol}${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${symbol}${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return `${symbol}${value.toLocaleString('en-US')}`;
}

const SQFT_FMT = new Intl.NumberFormat('en-US');
export const formatSqFt = (value: number): string => `${SQFT_FMT.format(value)} sq ft`;
