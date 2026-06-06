import Link from 'next/link';
import type { PropertySummary } from '@contracts';
import {
  CityShowcase,
  GetOurApp,
  Hero,
  PriceTiers,
  SellerCta,
  TrustStrip,
  TrustedPartners,
  WhyOsk,
} from '@/components/home';
import { PropertyCard } from '@/components/property/PropertyCard';
import { serverFetch } from '@/lib/serverApi';
import styles from './page.module.scss';

// Home is a Server Component; featured listings are fetched + cached server-side.
export const revalidate = 120;

export default async function HomePage() {
  const featured = await serverFetch<PropertySummary[]>(
    '/properties?isFeatured=true&limit=6',
  );

  return (
    <>
      <Hero />

      <TrustStrip />

      {featured && featured.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitles}>
              <span className={styles.sectionEyebrow}>Hand-picked</span>
              <h2 className={styles.sectionTitle}>Featured listings</h2>
            </div>
            <Link href="/buy" className={styles.seeAll}>
              See all listings →
            </Link>
          </div>
          <div className={styles.featured}>
            {featured.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                priority={index < 3}
              />
            ))}
          </div>
        </section>
      ) : null}

      <CityShowcase />

      <PriceTiers />

      <WhyOsk />

      <GetOurApp />

      <TrustedPartners />

      <SellerCta />
    </>
  );
}
