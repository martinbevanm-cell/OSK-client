'use client';

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import Image from 'next/image';
import type { PropertyMedia } from '@contracts';
import { cn } from '@/lib/cn';
import styles from './PropertyImageLightbox.module.scss';

interface PropertyImageLightboxProps {
  images: PropertyMedia[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}

/**
 * Full-screen photo viewer. Used by PropertyGallery.
 * ▸ Keyboard: Esc closes; ←/→ navigate.
 * ▸ Touch: horizontal swipe navigates.
 * ▸ Backdrop click closes; clicks on the image / chrome do not.
 * ▸ Body scroll is locked while open.
 */
export function PropertyImageLightbox({
  images,
  initialIndex,
  title,
  onClose,
}: PropertyImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const count = images.length;
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  /* Keyboard + body-scroll lock */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (delta > 60) prev();
    else if (delta < -60) next();
    touchStartX.current = null;
  };

  const current = images[index]!;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
    >
      <div className={styles.bar} onClick={(e) => e.stopPropagation()}>
        <span className={styles.counter}>
          {index + 1} / {count}
        </span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onClose}
          aria-label="Close gallery"
        >
          <CloseIcon />
        </button>
      </div>

      {count > 1 ? (
        <button
          type="button"
          className={cn(styles.nav, styles.navPrev)}
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous photo"
        >
          <ChevronIcon dir="left" />
        </button>
      ) : null}

      <div
        className={styles.stage}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={current.id}
          src={current.url}
          alt={`${title} — photo ${index + 1}`}
          fill
          sizes="100vw"
          className={styles.stageImg}
          priority
        />
      </div>

      {count > 1 ? (
        <button
          type="button"
          className={cn(styles.nav, styles.navNext)}
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next photo"
        >
          <ChevronIcon dir="right" />
        </button>
      ) : null}

      {count > 1 ? (
        <div className={styles.strip} onClick={(e) => e.stopPropagation()}>
          {images.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={cn(styles.stripItem, i === index && styles.stripItemActive)}
              onClick={() => setIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === index}
            >
              <Image src={m.url} alt="" fill sizes="80px" className={styles.stripImg} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── inline icons ─────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  const d = dir === 'left' ? 'M13 4l-6 6 6 6' : 'M7 4l6 6-6 6';
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
