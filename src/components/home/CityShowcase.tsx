import Image from 'next/image';
import Link from 'next/link';
import styles from './CityShowcase.module.scss';

interface City {
  id: string;
  name: string;
  state: string;
  blurb: string;
  image: string;
  listings: string;
}

const img = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const CITIES: City[] = [
  {
    id: 'new-york-ny',
    name: 'New York',
    state: 'NY',
    blurb: 'Brownstones, lofts, and Park-side classics.',
    image: img('photo-1496442226666-8d4d0e62e6e9'),
    listings: '1,820 listings',
  },
  {
    id: 'los-angeles-ca',
    name: 'Los Angeles',
    state: 'CA',
    blurb: 'Hillside moderns and canyon retreats.',
    image: img('photo-1444723121867-7a241cacace9'),
    listings: '1,540 listings',
  },
  {
    id: 'miami-fl',
    name: 'Miami',
    state: 'FL',
    blurb: 'Oceanfront condos and South Beach lofts.',
    image: img('photo-1493809842364-78817add7ffb'),
    listings: '980 listings',
  },
  {
    id: 'austin-tx',
    name: 'Austin',
    state: 'TX',
    blurb: 'Craftsman bungalows and Hill Country ranches.',
    image: img('photo-1531218150217-54595bc2b934'),
    listings: '760 listings',
  },
  {
    id: 'san-francisco-ca',
    name: 'San Francisco',
    state: 'CA',
    blurb: 'Pacific Heights flats and historic Victorians.',
    image: img('photo-1449034446853-66c86144b0ad'),
    listings: '690 listings',
  },
  {
    id: 'chicago-il',
    name: 'Chicago',
    state: 'IL',
    blurb: 'Lakeshore towers and Fulton Market lofts.',
    image: img('photo-1494522855154-9297ac14b55f'),
    listings: '880 listings',
  },
];

/** Image-led city tiles routing to /buy?city=<id>. Server component. */
export function CityShowcase() {
  return (
    <section className={styles.section} aria-labelledby="cities-heading">
      <header className={styles.head}>
        <span className={styles.eyebrow}>By market</span>
        <h2 id="cities-heading" className={styles.title}>
          Find a home in your <em>favorite city.</em>
        </h2>
        <p className={styles.sub}>
          Browse hand-vetted homes across the world&rsquo;s most sought-after markets —
          from coastal towers to canyon retreats.
        </p>
      </header>

      <div className={styles.grid}>
        {CITIES.map((city) => (
          <Link key={city.id} href={`/buy?city=${city.id}`} className={styles.card}>
            <div className={styles.media}>
              <Image
                src={city.image}
                alt={`${city.name}, ${city.state}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.image}
              />
              <div className={styles.scrim} aria-hidden="true" />
            </div>
            <div className={styles.body}>
              <div className={styles.heading}>
                <h3 className={styles.cityName}>
                  {city.name}
                  <span className={styles.state}>{city.state}</span>
                </h3>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </div>
              <p className={styles.blurb}>{city.blurb}</p>
              <p className={styles.listings}>{city.listings}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
