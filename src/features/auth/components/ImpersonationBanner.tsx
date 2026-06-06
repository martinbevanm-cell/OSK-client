'use client';

import { useRouter } from 'next/navigation';
import { baseApi } from '@/store/api/baseApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  impersonationStopped,
  selectCurrentUser,
  selectImpersonatingAdmin,
  selectIsImpersonating,
} from '../authSlice';
import styles from './ImpersonationBanner.module.scss';

/**
 * Fixed-position banner across the top of the app shown only when an
 * admin has impersonated another user. Click "Stop" → swap back to the
 * admin's stashed session and wipe RTK caches so every view re-reads
 * with the right credentials.
 */
export function ImpersonationBanner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isImpersonating = useAppSelector(selectIsImpersonating);
  const target = useAppSelector(selectCurrentUser);
  const admin = useAppSelector(selectImpersonatingAdmin);

  if (!isImpersonating || !target || !admin) return null;

  const stop = () => {
    dispatch(impersonationStopped());
    dispatch(baseApi.util.resetApiState());
    /* Route back to /admin where this trip started. */
    router.push('/admin/users');
  };

  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <circle
            cx="12"
            cy="8"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <p className={styles.copy}>
        Impersonating <strong>{target.name}</strong>{' '}
        <span className={styles.email}>({target.email})</span> · signed in as{' '}
        <strong>{admin.email}</strong>
      </p>
      <button type="button" className={styles.stopBtn} onClick={stop}>
        Stop impersonating
      </button>
    </div>
  );
}
