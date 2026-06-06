'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContactCapabilities } from '@contracts';
import {
  useLazyGetWhatsAppLinkQuery,
  useLogCallIntentMutation,
} from '@/features/contact';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { PhoneIcon, WhatsAppIcon } from '../ContactChannels/icons';
import { cn } from '@/lib/cn';
import styles from './PropertyQuickActions.module.scss';

interface PropertyQuickActionsProps {
  propertyId: string;
  capabilities: ContactCapabilities;
}

/**
 * Above-the-fold quick contact actions: Save / WhatsApp / Call.
 * Call behaviour: on touch devices we open the system dialer via `tel:`;
 * on desktop we show a popover with the masked number, a tap-to-call link
 * and a copy-to-clipboard button.
 */
export function PropertyQuickActions({
  propertyId,
  capabilities,
}: PropertyQuickActionsProps) {
  const dispatch = useAppDispatch();
  const [saved, setSaved] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const callWrapRef = useRef<HTMLDivElement | null>(null);
  const [logCallIntent] = useLogCallIntentMutation();
  const [fetchWhatsApp, { isFetching: waLoading }] =
    useLazyGetWhatsAppLinkQuery();

  const phone = useMemo(() => derivePhone(propertyId), [propertyId]);

  /* outside-click + ESC for the call popover */
  useEffect(() => {
    if (!callOpen) return undefined;
    const onPointer = (e: PointerEvent) => {
      if (!callWrapRef.current?.contains(e.target as Node)) {
        setCallOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCallOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [callOpen]);

  const handleSave = () => {
    setSaved((s) => {
      const next = !s;
      dispatch(
        toastPushed(
          next ? 'success' : 'info',
          next ? 'Saved to your list.' : 'Removed from saved.',
        ),
      );
      return next;
    });
  };

  const handleWhatsApp = async () => {
    try {
      const res = await fetchWhatsApp(propertyId).unwrap();
      if (res.enabled && res.href) {
        window.open(res.href, '_blank', 'noopener,noreferrer');
      } else {
        dispatch(
          toastPushed('info', 'WhatsApp is not available for this listing.'),
        );
      }
    } catch {
      /* failure toast raised globally */
    }
  };

  const handleCall = useCallback(async () => {
    /* fire-and-forget analytics */
    try {
      await logCallIntent({ propertyId, source: 'detail-page' }).unwrap();
    } catch {
      /* non-blocking */
    }

    /* Touch device → open dialer directly. Desktop → show popover. */
    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches;
    if (isTouch) {
      window.location.href = `tel:${phone.tel}`;
      return;
    }
    setCallOpen((o) => !o);
  }, [logCallIntent, propertyId, phone.tel]);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone.tel);
      dispatch(toastPushed('success', 'Phone number copied.'));
    } catch {
      dispatch(toastPushed('info', phone.display));
    }
  };

  return (
    <div className={styles.actions} role="toolbar" aria-label="Quick actions">
      <button
        type="button"
        onClick={handleSave}
        className={cn(styles.action, styles.save, saved && styles.saveActive)}
        aria-pressed={saved}
      >
        <HeartIcon filled={saved} />
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>

      {capabilities.whatsapp ? (
        <button
          type="button"
          onClick={handleWhatsApp}
          className={cn(styles.action, styles.whatsapp)}
          disabled={waLoading}
        >
          <WhatsAppIcon className={styles.icon} />
          <span>WhatsApp</span>
        </button>
      ) : null}

      {capabilities.call.enabled ? (
        <div className={styles.callWrap} ref={callWrapRef}>
          <button
            type="button"
            onClick={handleCall}
            className={cn(styles.action, styles.call)}
            aria-expanded={callOpen}
            aria-haspopup="dialog"
          >
            <PhoneIcon className={styles.icon} />
            <span>Call</span>
          </button>

          {callOpen ? (
            <div
              className={styles.callPopover}
              role="dialog"
              aria-label="Phone number"
            >
              <span className={styles.callEyebrow}>Direct line</span>
              <a className={styles.phoneLink} href={`tel:${phone.tel}`}>
                {phone.display}
              </a>
              <p className={styles.callHint}>
                Mon–Sat, 8am–8pm ET · OSK-verified line
              </p>
              <div className={styles.callRow}>
                <a
                  href={`tel:${phone.tel}`}
                  className={cn(styles.callPrimary)}
                >
                  <PhoneIcon className={styles.icon} />
                  Tap to call
                </a>
                <button
                  type="button"
                  onClick={copyPhone}
                  className={styles.callSecondary}
                >
                  <CopyIcon />
                  Copy
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

/** Deterministic stub number until the backend exposes a real one. */
function derivePhone(seed: string): { display: string; tel: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const last4 = String(Math.abs(h) % 10_000).padStart(4, '0');
  return {
    display: `+1 (212) 555-${last4}`,
    tel: `+1212555${last4}`,
  };
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
