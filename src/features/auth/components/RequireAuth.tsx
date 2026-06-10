'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole } from '@contracts';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated, selectUserRole } from '../authSlice';
import { useSessionQuery } from '../authApi';
import styles from './RequireAuth.module.scss';

interface RequireAuthProps {
  children: ReactNode;
  /** If set, the user's role must be one of these. */
  roles?: UserRole[];
}

/**
 * Client-side route guard. Waits for the session query to settle, then either
 * renders the children, redirects unauthenticated users to /sign-in (carrying
 * a `next` param), or shows a not-authorized notice for the wrong role.
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading } = useSessionQuery();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectUserRole);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className={styles.gate}>
        <p className={styles.muted}>Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirect in flight
  }

  if (roles && (role === null || !roles.includes(role))) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.title}>Not authorized</h1>
        <p className={styles.muted}>Your account doesn’t have access to this area.</p>
      </div>
    );
  }

  return <>{children}</>;
}
