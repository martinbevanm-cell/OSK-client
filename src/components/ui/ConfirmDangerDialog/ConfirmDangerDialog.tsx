'use client';

import { useEffect, useRef } from 'react';
import { Button } from '../Button';
import styles from './ConfirmDangerDialog.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Generic "are you sure?" modal for destructive actions.
 *
 * Pattern: caller renders this component only when it's open and
 * passes a list of `consequences` bullets that explain — in plain
 * English — what the action will do downstream. The user has to
 * click the danger-colored confirm button to proceed; Esc and a
 * backdrop click both cancel.
 *
 * This avoids the ergonomics of native window.confirm (no styling,
 * no rich text) and the brittleness of one-off modals scattered
 * across feature folders.
 * ──────────────────────────────────────────────────────────────── */

interface Props {
  title: string;
  /** Optional intro paragraph above the consequences list. */
  description?: string;
  /** Plain-English bullet points describing what happens on confirm. */
  consequences: string[];
  confirmLabel: string;
  cancelLabel?: string;
  /** Pending state during the network call. */
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDangerDialog({
  title,
  description,
  consequences,
  confirmLabel,
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* Close on Esc — but only when not busy, otherwise the user could
     * dismiss the modal mid-network-call and leave the parent in a
     * confused state. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    /* Move focus into the panel so the next Tab lands on a real
     * control instead of the page behind us. */
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-danger-title"
        tabIndex={-1}
      >
        <header className={styles.head}>
          <span className={styles.eyebrow}>Confirm</span>
          <h2 id="confirm-danger-title" className={styles.title}>
            {title}
          </h2>
          {description ? <p className={styles.body}>{description}</p> : null}
        </header>

        {consequences.length > 0 ? (
          <div className={styles.consequences}>
            <p className={styles.consequencesLabel}>This will:</p>
            <ul className={styles.list}>
              {consequences.map((c) => (
                <li key={c} className={styles.item}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className={styles.warn}>This action cannot be undone.</p>

        <footer className={styles.foot}>
          <button
            type="button"
            className={styles.ghost}
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </footer>
      </div>
    </div>
  );
}
