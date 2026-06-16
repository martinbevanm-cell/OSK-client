'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import styles from './RejectReasonDialog.module.scss';

/**
 * Reason picker dialog used by the moderation queue. Replaces the
 * old `window.prompt` flow with:
 *  - A focused, accessible <dialog> with backdrop dismiss + Escape
 *  - Quick-select preset chips for the common rejection reasons
 *  - A textarea for the per-listing detail (always required)
 *  - Soft validation: empty reason disables Confirm
 *
 * Works for both single-row and bulk reject — the parent controls
 * the title and subtitle, and gets a single string back via
 * `onConfirm`.
 */

const PRESET_REASONS = [
  'Photos are missing, blurry, or low quality',
  'Price looks inconsistent with the area and listing type',
  'Title or description is too short / unclear',
  'Looks like a duplicate of an existing listing',
  'Required fields (location, contact, amenities) are incomplete',
  'Listing appears spammy or off-topic',
];

interface RejectReasonDialogProps {
  /** When false the dialog is unmounted. */
  open: boolean;
  /** Heading shown at the top of the dialog. */
  title: string;
  /** Sub-line explaining who will see the reason. */
  subtitle: string;
  /** Disable Confirm while the request is in flight. */
  submitting?: boolean;
  /** Hides the dialog without committing. */
  onCancel: () => void;
  /** Sends the trimmed, non-empty reason back to the parent. */
  onConfirm: (reason: string) => void;
}

export function RejectReasonDialog({
  open,
  title,
  subtitle,
  submitting,
  onCancel,
  onConfirm,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* Reset draft on every open, then focus the textarea so the admin
   * can start typing immediately (or click a preset chip). */
  useEffect(() => {
    if (open) {
      setReason('');
      /* Defer one tick so the dialog has actually mounted in the DOM
       * before we try to grab focus — otherwise the focus is lost on
       * the close animation of a previous instance. */
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  /* Escape closes the dialog. Attach + clean up only while open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0 && !submitting;

  /* When a preset chip is tapped: if the textarea is empty, drop the
   * preset in as-is; otherwise append on a new line so the admin can
   * stack multiple reasons. */
  const onPresetClick = (preset: string) => {
    setReason((cur) => (cur.trim().length === 0 ? preset : `${cur.trim()}\n${preset}`));
    textareaRef.current?.focus();
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
      onClick={() => {
        if (!submitting) onCancel();
      }}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Moderation · Reject</p>
          <h2 id="reject-dialog-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.sub}>{subtitle}</p>
        </header>

        <section className={styles.presets} aria-label="Common reasons">
          <p className={styles.presetsLabel}>Quick reasons</p>
          <div className={styles.chipRow}>
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={styles.chip}
                onClick={() => onPresetClick(preset)}
                disabled={submitting}
              >
                {preset}
              </button>
            ))}
          </div>
        </section>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Reason <span className={styles.required}>required</span>
          </span>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            rows={6}
            placeholder="Be specific. The seller sees this verbatim — what should they fix before resubmitting?"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            disabled={submitting}
            maxLength={1000}
          />
          <span className={styles.helper}>{trimmed.length}/1000 characters</span>
        </label>

        <footer className={styles.foot}>
          <button
            type="button"
            className={styles.ghost}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (canConfirm) onConfirm(trimmed);
            }}
            disabled={!canConfirm}
          >
            {submitting ? 'Rejecting…' : 'Send rejection'}
          </Button>
        </footer>
      </div>
    </div>
  );
}
