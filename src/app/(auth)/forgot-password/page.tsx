import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth';
import styles from '../layout.module.scss';

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.subtitle}>
        Enter your email and we’ll send a link to set a new password.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
