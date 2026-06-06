'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { useVerifyEmailMutation } from '../authApi';
import styles from './AuthForm.module.scss';

type VerifyState = 'verifying' | 'success' | 'error';

export function VerifyEmail() {
  const token = useSearchParams().get('token') ?? '';
  const [verifyEmail] = useVerifyEmailMutation();
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'error');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // guard against StrictMode double-invoke
    verifyEmail({ token })
      .unwrap()
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token, verifyEmail]);

  if (state === 'verifying') {
    return (
      <div className={styles.status}>
        <p>Verifying your email…</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className={styles.status}>
        <p className={styles.statusOk}>Your email address is verified.</p>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.status}>
      <p className={styles.statusError}>
        This verification link is invalid or has expired.
      </p>
      <Link href="/sign-in">
        <Button variant="secondary">Back to sign in</Button>
      </Link>
    </div>
  );
}
