import Image from 'next/image';
import Link from 'next/link';
import type { ContactCapabilities, PropertySummary } from '@contracts';
import { Badge } from '@/components/ui';
import { ContactChannels } from '@/components/property/ContactChannels';
import { SaveButton } from '@/features/saved';
import { formatArea, formatPrice } from '@/lib/format';
import { getCountry } from '@/lib/geoData';
import styles from './PropertyCard.module.scss';

/* Force-enable every channel until per-owner admin toggles ship — keeps
 * the contact UX consistent with the detail page. */
const ALL_CHANNELS: ContactCapabilities = {
  chat: true,
  call: { enabled: true, masked: false },
  whatsapp: true,
  email: true,
};

export interface PropertyCardProps {
  property: PropertySummary;
  /** Higher priority for above-the-fold cards (LCP). */
  priority?: boolean;
}

/** Listing-grid card. Presentation only — all colors come from theme tokens. */
export function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const href = `/property/${property.slug}`;
  const area = formatArea(property.areaSqft);
  /* Resolve the full country name from the ISO-2 stored on the listing.
   * Falls back to the raw code if the dataset doesn't know about it. */
  const country = getCountry(property.country);
  const countryLabel = country?.name ?? property.country;
  const countryFlag = country?.flag;

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.media} aria-label={property.title}>
        <Image
          src={property.thumbnail}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
          priority={priority}
        />
        <div className={styles.badges}>
          {property.listingKind === 'new-project' ? (
            <Badge tone="new">New Project</Badge>
          ) : (
            <Badge tone="resale">Resale</Badge>
          )}
          {property.isFeatured && <Badge tone="featured">Featured</Badge>}
          {property.status === 'sold' && <Badge tone="sold">Sold</Badge>}
        </div>
      </Link>

      <div className={styles.save}>
        <SaveButton property={property} variant="corner" />
      </div>

      <div className={styles.body}>
        <p className={styles.price}>{formatPrice(property.price, property.currency)}</p>
        <h3 className={styles.title}>
          <Link href={href}>{property.title}</Link>
        </h3>
        <p className={styles.location}>
          <span className={styles.locationLine}>
            {property.locality}, {property.city}
          </span>
          <span className={styles.country} title={countryLabel}>
            {countryFlag ? (
              <span className={styles.countryFlag} aria-hidden="true">
                {countryFlag}
              </span>
            ) : null}
            <span className={styles.countryName}>{countryLabel}</span>
          </span>
        </p>

        <ul className={styles.specs}>
          {property.bedrooms != null && <li>{property.bedrooms} bd</li>}
          {property.bathrooms != null && <li>{property.bathrooms} ba</li>}
          {area && <li>{area}</li>}
          <li className={styles.type}>{property.type}</li>
        </ul>
      </div>

      <div className={styles.contact}>
        <ContactChannels
          propertyId={property.id}
          capabilities={ALL_CHANNELS}
          variant="card"
          source="listing-card"
          ownerId={property.ownerId}
        />
      </div>
    </article>
  );
}
