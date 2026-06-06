import type { Metadata } from 'next';
import { SignUpForm } from '@/features/auth';
import styles from '../layout.module.scss';

export const metadata: Metadata = {
  title: 'Create account',
  robots: { index: false },
};

export default function SignUpPage() {
  return (
    <>
      <h1 className={styles.title}>Create your account</h1>
      <p className={styles.subtitle}>
        Join OSK to save homes, contact owners and list properties.
      </p>
      <SignUpForm />
    </>
  );
}
