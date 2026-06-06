import styles from './loading.module.scss';

/**
 * Route-level loading UI. Renders during server navigation, before the
 * matched page resolves. Subtle skeleton bars + brand dot pulse — keeps
 * the page from flashing blank.
 */
export default function RootLoading() {
  return (
    <div className={styles.shell} role="status" aria-live="polite">
      <div className={styles.brandRow}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.label}>Loading OSK…</span>
      </div>

      <div className={styles.bars}>
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </div>
    </div>
  );
}
