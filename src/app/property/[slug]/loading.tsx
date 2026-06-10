import styles from './loading.module.scss';

/**
 * Property detail skeleton. Matches the new layout: breadcrumb row,
 * full-width gallery, two-column body (lede + sections | contact rail).
 */
export default function PropertyDetailLoading() {
  return (
    <article className={styles.shell} aria-hidden="true">
      <div className={styles.crumbs}>
        <span className={styles.crumb} />
        <span className={styles.crumb} />
      </div>

      <div className={styles.gallery} />

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.lede}>
            <span className={styles.bar} style={{ inlineSize: '7rem' }} />
            <span
              className={styles.bar}
              style={{ inlineSize: '70%', blockSize: '2.4rem' }}
            />
            <span className={styles.bar} style={{ inlineSize: '50%' }} />
          </div>

          <div className={styles.block} />
          <div className={styles.block} />
          <div className={styles.block} />
        </div>
        <div className={styles.aside} />
      </div>
    </article>
  );
}
