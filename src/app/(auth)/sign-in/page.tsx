import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignInForm } from '@/features/auth';
import styles from '../layout.module.scss';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>
        Sign in to manage your listings, leads and saved homes.
      </p>
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
