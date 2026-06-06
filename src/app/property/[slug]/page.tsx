import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ContactCapabilities, Property } from '@contracts';
import { ContactChannels } from '@/components/property/ContactChannels';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyLocationMap } from '@/components/property/PropertyLocationMap';
import { PropertyViewTracker } from '@/components/property/PropertyViewTracker';
import { PropertyReviews } from '@/features/reviews';
import { serverFetch } from '@/lib/serverApi';
import { formatArea, formatPrice } from '@/lib/format';
import { propertyJsonLd } from '@/lib/seo';
import styles from './page.module.scss';

export const revalidate = 120;

interface PageParams {
  params: Promise<{ slug: string }>;
}

/* Every listing offers every contact channel until the per-owner admin toggles ship. */
const ALL_CHANNELS: ContactCapabilities = {
  chat: true,
  call: { enabled: true, masked: false },
  whatsapp: true,
  email: true,
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const property = await serverFetch<Property>(`/properties/${slug}`);
  if (!property) return { title: 'Property not found' };
  return {
    title: property.title,
    description: property.description.slice(0, 160),
    openGraph: { images: [property.thumbnail] },
  };
}

export default async function PropertyDetailPage({ params }: PageParams) {
  const { slug } = await params;
  const property = await serverFetch<Property>(`/properties/${slug}`);
  if (!property) notFound();

  const images = property.media.filter((m) => m.kind === 'image');
  const areaLabel = formatArea(property.areaSqft);
  const [longitude, latitude] = property.location.coordinates;
  const intentRoute =
    property.type === 'rental'
      ? '/rent'
      : property.type === 'commercial'
        ? '/commercial'
        : property.type === 'plot'
          ? '/plots'
          : '/buy';

  const facts: Array<{ label: string; value: string }> = [
    {
      label: 'Property Type',
      value: property.type[0]!.toUpperCase() + property.type.slice(1),
    },
    {
      label: 'Listing',
      value: property.listingKind === 'new-project' ? 'New Project' : 'Resale',
    },
  ];
  if (property.bedrooms != null)
    facts.push({ label: 'Bedrooms', value: String(property.bedrooms) });
  if (property.bathrooms != null)
    facts.push({ label: 'Bathrooms', value: String(property.bathrooms) });
  if (areaLabel) facts.push({ label: 'Living Area', value: areaLabel });
  if (property.yearBuilt)
    facts.push({ label: 'Year Built', value: String(property.yearBuilt) });

  return (
    <article className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(propertyJsonLd(property)),
        }}
      />

      {/* Silent analytics ping — once per (tab × listing). */}
      <PropertyViewTracker propertyId={property.id} />

      {/* breadcrumbs */}
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/" className={styles.crumb}>
          Home
        </Link>
        <span className={styles.crumbSep} aria-hidden="true">
          ›
        </span>
        <Link href={intentRoute} className={styles.crumb}>
          {property.city}
        </Link>
        <span className={styles.crumbSep} aria-hidden="true">
          ›
        </span>
        <span className={styles.crumbActive}>{property.locality}</span>
      </nav>

      {/* ── full-width gallery ──────────────────────────────────────── */}
      <PropertyGallery
        images={images}
        title={property.title}
        listingKind={property.listingKind}
        isFeatured={property.isFeatured}
        status={property.status}
      />

      {/* ── 2-col layout: lede + sections | sticky contact card ────── */}
      <div className={styles.layout}>
        <div className={styles.main}>
          {/* Lede — plain typography, no card */}
          <header className={styles.lede}>
            <p className={styles.ledeLocality}>
              <span className={styles.ledeDot} aria-hidden="true" />
              {property.locality}, {property.city}
            </p>
            <h1 className={styles.ledeTitle}>{property.title}</h1>

            <div className={styles.ledeBottom}>
              <ul className={styles.ledeMeta}>
                {property.bedrooms != null ? (
                  <li>
                    <strong>{property.bedrooms}</strong>
                    <span>BD</span>
                  </li>
                ) : null}
                {property.bathrooms != null ? (
                  <li>
                    <strong>{property.bathrooms}</strong>
                    <span>BA</span>
                  </li>
                ) : null}
                {areaLabel ? (
                  <li>
                    <strong>{areaLabel}</strong>
                  </li>
                ) : null}
                {property.yearBuilt ? (
                  <li>
                    <span>Built</span>
                    <strong>{property.yearBuilt}</strong>
                  </li>
                ) : null}
              </ul>

              <div className={styles.ledePriceBlock}>
                <span className={styles.priceLabel}>
                  {property.type === 'rental' ? 'Monthly Rent' : 'Asking Price'}
                </span>
                <p className={styles.price}>
                  {formatPrice(property.price, property.currency)}
                  {property.type === 'rental' ? (
                    <span className={styles.priceUnit}> /mo</span>
                  ) : null}
                </p>
              </div>
            </div>
          </header>

          {/* Key facts */}
          <section className={styles.block} aria-labelledby="facts-heading">
            <div className={styles.blockHeader}>
              <span className={styles.blockEyebrow}>Overview</span>
              <h2 className={styles.blockTitle} id="facts-heading">
                Key facts
              </h2>
            </div>
            <dl className={styles.facts}>
              {facts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt className={styles.factLabel}>{fact.label}</dt>
                  <dd className={styles.factValue}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Description */}
          <section className={styles.block} aria-labelledby="about-heading">
            <div className={styles.blockHeader}>
              <span className={styles.blockEyebrow}>About this home</span>
              <h2 className={styles.blockTitle} id="about-heading">
                Description
              </h2>
            </div>
            <p className={styles.description}>{property.description}</p>
          </section>

          {/* Amenities */}
          {property.amenities.length > 0 ? (
            <section
              className={styles.block}
              aria-labelledby="amenities-heading"
            >
              <div className={styles.blockHeader}>
                <span className={styles.blockEyebrow}>Inside &amp; out</span>
                <h2 className={styles.blockTitle} id="amenities-heading">
                  Amenities
                </h2>
              </div>
              <ul className={styles.amenities}>
                {property.amenities.map((amenity) => (
                  <li key={amenity} className={styles.amenity}>
                    <span className={styles.amenityCheck} aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="14" height="14">
                        <path
                          d="M3.5 8.5l3 3 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Location map */}
          <section className={styles.block} aria-labelledby="location-heading">
            <div className={styles.blockHeader}>
              <span className={styles.blockEyebrow}>On the map</span>
              <h2 className={styles.blockTitle} id="location-heading">
                Location &amp; neighborhood
              </h2>
            </div>
            <p className={styles.locationLead}>
              {property.locality} · {property.city}
            </p>
            <PropertyLocationMap
              longitude={longitude}
              latitude={latitude}
              label={property.title}
              caption={`${property.locality}, ${property.city}`}
            />
          </section>

          {/* Reviews */}
          <section className={styles.block} aria-labelledby="reviews-heading">
            <div className={styles.blockHeader}>
              <span className={styles.blockEyebrow}>What buyers say</span>
              <h2 className={styles.blockTitle} id="reviews-heading">
                Reviews
              </h2>
            </div>
            <PropertyReviews propertyId={property.id} />
          </section>
        </div>

        {/* sticky contact rail */}
        <aside className={styles.aside} id="contact">
          <div className={styles.contactCard}>
            <div className={styles.contactHeader}>
              <span className={styles.contactBadge}>Direct line</span>
              <p className={styles.contactTitle}>Contact the owner</p>
              <p className={styles.contactNote}>
                Your details are shared only with this listing’s owner — never
                published, never sold.
              </p>
            </div>

            <ContactChannels
              propertyId={property.id}
              capabilities={ALL_CHANNELS}
              variant="detail"
              source="detail-page"
              ownerId={property.ownerId}
            />

            <div className={styles.contactFootnote}>
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  d="M12 1l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                OSK verified listing · Last updated {formatDate(property.updatedAt)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}
