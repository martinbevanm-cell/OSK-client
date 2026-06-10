'use client';

import type { MouseEvent } from 'react';
import type { PropertySummary } from '@contracts';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toastPushed } from '@/features/ui';
import { cn } from '@/lib/cn';
import { saved, selectIsSaved, unsaved } from '../savedSlice';
import styles from './SaveButton.module.scss';

interface SaveButtonProps {
  property: PropertySummary;
  /** Visual variant — `corner` floats on top-right of imagery; `inline` sits in a row. */
  variant?: 'corner' | 'inline';
  className?: string;
}

/**
 * Heart-toggle button. Click toggles save state in the Redux `saved` slice
 * and fires a toast. Used in PropertyCard (corner) and elsewhere later.
 * Stops event propagation so the surrounding card-link doesn't navigate.
 */
export function SaveButton({ property, variant = 'corner', className }: SaveButtonProps) {
  const dispatch = useAppDispatch();
  const isSaved = useAppSelector((s) => selectIsSaved(s, property.id));

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
      dispatch(unsaved(property.id));
      dispatch(toastPushed('info', 'Removed from saved.'));
    } else {
      dispatch(saved(property));
      dispatch(toastPushed('success', 'Saved to your list.'));
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        styles.btn,
        variant === 'inline' && styles.inline,
        isSaved && styles.active,
        className,
      )}
      aria-pressed={isSaved}
      aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
      title={isSaved ? 'Saved' : 'Save listing'}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {variant === 'inline' ? (
        <span className={styles.label}>{isSaved ? 'Saved' : 'Save'}</span>
      ) : null}
    </button>
  );
}
