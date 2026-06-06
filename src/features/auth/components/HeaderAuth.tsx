'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import { disconnectSocket } from '@/realtime/socket';
import { selectCurrentUser } from '../authSlice';
import { useLogoutMutation } from '../authApi';
import styles from './HeaderAuth.module.scss';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

interface HeaderAuthProps {
  /**
   * `menu`  — desktop default; renders an avatar trigger that pops a
   *           dropdown with all account links + sign out.
   * `inline` — mobile drawer; renders a flat Sign in / Sign up pair when
   *           signed out, or a single Sign out button when signed in.
   *           Account links (Dashboard / Profile / Saved / Admin) live
   *           directly in the drawer above, so this variant doesn't
   *           duplicate them.
   */
  variant?: 'menu' | 'inline';
}

/** Auth-aware header control: sign-in link, or a user menu with sign-out. */
export function HeaderAuth({ variant = 'menu' }: HeaderAuthProps = {}) {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* outside-click + ESC close */
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      /* logout clears local state regardless */
    }
    disconnectSocket();
    setOpen(false);
    dispatch(toastPushed('info', 'Signed out.'));
    router.push('/');
  };

  if (!user) {
    /* Mobile drawer + desktop bar share the same guest CTAs; the only
     * difference is layout, handled by the styles.guest container. */
    return (
      <div className={styles.guest}>
        <Link href="/sign-in" className={styles.guestLink}>
          Sign in
        </Link>
        <Link href="/sign-up" className={styles.signIn}>
          Sign up
        </Link>
      </div>
    );
  }

  /* Mobile drawer: skip the floating dropdown entirely. Account links
   * are surfaced in the drawer body above, so all we need here is a
   * sign-out button that fits the drawer footer. */
  if (variant === 'inline') {
    return (
      <button
        type="button"
        className={styles.inlineSignOut}
        disabled={isLoading}
        onClick={onSignOut}
      >
        {isLoading ? 'Signing out…' : 'Sign out'}
      </button>
    );
  }

  return (
    <div ref={wrapRef} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" />
          ) : (
            initialsOf(user.name)
          )}
        </span>
        <span className={styles.name}>{user.name.split(' ')[0]}</span>
        <span className={styles.caret} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12">
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.identity}>
            <span className={styles.identityAvatar} aria-hidden="true">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" />
              ) : (
                initialsOf(user.name)
              )}
            </span>
            <span className={styles.identityCopy}>
              <span className={styles.identityName}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </span>
          </div>

          <div className={styles.group}>
            <Link
              href="/dashboard"
              className={styles.item}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/profile"
              className={styles.item}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/saved"
              className={styles.item}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Saved listings
            </Link>
            {user.role === 'admin' ? (
              <Link
                href="/admin"
                className={styles.item}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            ) : null}
          </div>

          <div className={styles.group}>
            <button
              type="button"
              className={styles.itemDanger}
              role="menuitem"
              disabled={isLoading}
              onClick={onSignOut}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
