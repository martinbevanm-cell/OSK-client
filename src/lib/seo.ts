import type { Property } from '@contracts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'OSK';

/** JSON-LD for the organization — render once in the root layout. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/** JSON-LD for a property detail page (schema.org/RealEstateListing). */
export function propertyJsonLd(p: Property) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    description: p.description,
    url: `${SITE_URL}/property/${p.slug}`,
    image: p.media.filter((m) => m.kind === 'image').map((m) => m.url),
    datePosted: p.createdAt,
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: p.currency,
      availability: p.status === 'sold' ? 'SoldOut' : 'InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.locality,
      addressRegion: p.city,
    },
  };
}
