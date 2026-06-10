'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { selectIsAuthenticated } from '@/features/auth';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../notificationsApi';
import type { Notification } from '@contracts';
import styles from './NotificationsBell.module.scss';

const POLL_MS = 30_000;

/**
 * Header bell. Polls /notifications in the background, surfaces an unread
 * count badge, opens a dropdown with the latest items. Clicking an item
 * marks it read and navigates to its target. Anonymous users see nothing.
 */
export function NotificationsBell() {
  const isAuthed = useAppSelector(selectIsAuthenticated);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const { data } = useListNotificationsQuery(
    isAuthed ? { page: 1, limit: 10 } : undefined,
    { skip: !isAuthed, pollingInterval: POLL_MS },
  );

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  /* outside-click + ESC */
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

  if (!isAuthed) return null;

  const unread = data?.unread ?? 0;
  const items: Notification[] = data?.items ?? [];

  const onItemClick = async (n: Notification) => {
    if (!n.read) void markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div ref={wrapRef} className={styles.root}>
      <button
        type="button"
        className={cn(styles.trigger, unread > 0 && styles.triggerActive)}
        aria-label={
          unread === 0
            ? 'Notifications'
            : `${unread} unread notification${unread === 1 ? '' : 's'}`
        }
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <span className={styles.menuTitle}>Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                className={styles.menuMarkAll}
                disabled={markingAll}
                onClick={() => void markAllRead()}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className={styles.empty}>You&rsquo;re all caught up — no new activity.</p>
          ) : (
            <ul className={styles.list}>
              {items.map((n) => {
                const body = (
                  <>
                    <span
                      className={cn(styles.dot, n.read && styles.dotRead)}
                      aria-hidden="true"
                    />
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      {n.body ? <span className={styles.itemSub}>{n.body}</span> : null}
                      <span className={styles.itemTime}>
                        {new Date(n.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <button
                        type="button"
                        className={cn(styles.item, !n.read && styles.itemUnread)}
                        onClick={() => void onItemClick(n)}
                      >
                        {body}
                      </button>
                    ) : (
                      <div
                        className={cn(
                          styles.item,
                          styles.itemStatic,
                          !n.read && styles.itemUnread,
                        )}
                      >
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className={styles.menuFoot}>
            <Link
              href="/dashboard"
              className={styles.menuLink}
              onClick={() => setOpen(false)}
            >
              Open dashboard →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
