'use client';

import { useEffect } from 'react';
import { selectToasts, toastDismissed, type Toast } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';
import styles from './Toaster.module.scss';

const AUTO_DISMISS_MS = 5000;

/**
 * Global toast viewport. Mounted once in the root layout. Subscribes to the
 * `ui.toasts` slice and renders each toast as a token-themed pill in the
 * bottom-right corner. Each toast auto-dismisses after 5s; clicking the
 * close button or the toast itself dismisses it immediately.
 */
export function Toaster() {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  /* Auto-dismiss timers — one per toast. */
  useEffect(() => {
    const timers = toasts.map((t) =>
      window.setTimeout(() => dispatch(toastDismissed(t.id)), AUTO_DISMISS_MS),
    );
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div
      className={styles.region}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dispatch(toastDismissed(toast.id))}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(styles.toast, styles[`kind_${toast.kind}`])}
      role={toast.kind === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden="true">
        {toast.kind === 'success' ? (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path
              d="M3 8.5l3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : toast.kind === 'error' ? (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path
              d="M8 5v4M8 11.5v.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path
              d="M8 7.5v4M8 4.75v.25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </span>
      <p className={styles.message}>{toast.message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
