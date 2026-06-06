import { HeroSearch } from './HeroSearch';
import styles from './Hero.module.scss';

/**
 * Centered hero. Server Component — the only client island is
 * HeroSearch. Every color/shadow/border resolves to a theme token, so the
 * whole section re-themes across luxe-light / luxe-dark / emerald /
 * sandstone with no code change.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bgLayer} aria-hidden="true">
        <div className={styles.bgGradientA} />
        <div className={styles.bgGradientB} />
      </div>

      <div className={styles.container}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Real Estate, Curated
          </span>

          <h1 className={styles.heading}>
            Find a home
            <br />
            <em>worth coming back to.</em>
          </h1>

          <p className={styles.sub}>
            Search homes, land and commercial space across major markets — from city
            brownstones to countryside ranches.
          </p>
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}
