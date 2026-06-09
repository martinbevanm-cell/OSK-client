'use client';

import { useGetMeQuery } from '@/features/users';
import { useResendVerificationMutation } from '@/features/auth';
import { selectCurrentUser } from '@/features/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import styles from './VerifyEmailBanner.module.scss';

/**
 * Banner rendered on the dashboard profile page when the signed-in user
 * hasn't verified their email yet. Wired to /auth/resend-verification.
 */
export function VerifyEmailBanner() {
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector(selectCurrentUser);
  const { data: me } = useGetMeQuery();
  const [resend, { isLoading }] = useResendVerificationMutation();
  const user = me ?? sessionUser;

  if (!user || user.emailVerified) return null;

  const onClick = async () => {
    try {
      const res = await resend().unwrap();
      dispatch(
        toastPushed(
          'success',
          res.alreadyVerified
            ? 'Email is already verified.'
            : 'Verification link sent — check your inbox.',
        ),
      );
    } catch {
      /* surfaced by the global toast surfaces the error envelope */
    }
  };

  return (
    <aside className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M4 7l8 6 8-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className={styles.copy}>
        <p className={styles.title}>Verify your email</p>
        <p className={styles.sub}>
          We sent a link to <strong>{user.email}</strong>. Confirm it to unlock saved
          listings, inquiries and messaging.
        </p>
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? 'Sending…' : 'Resend link'}
      </button>
    </aside>
  );
}
