import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth';
import styles from '../layout.module.scss';

export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className={styles.title}>Set a new password</h1>
      <p className={styles.subtitle}>Choose a strong password you’ll remember.</p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
