import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyEmail } from '@/features/auth';
import styles from '../layout.module.scss';

export const metadata: Metadata = {
  title: 'Verify email',
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <>
      <h1 className={styles.title}>Email verification</h1>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </>
  );
}
