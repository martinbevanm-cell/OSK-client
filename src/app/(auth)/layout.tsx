import Link from 'next/link';
import styles from './layout.module.scss';

/** Centered card chrome shared by every auth screen. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={styles.brand}>
          OSK
        </Link>
        {children}
      </div>
    </div>
  );
}
