'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui';
import type { ListingKind, PropertyMedia, PropertyStatus } from '@contracts';
import { cn } from '@/lib/cn';
import { PropertyImageLightbox } from './PropertyImageLightbox';
import styles from './PropertyGallery.module.scss';

interface PropertyGalleryProps {
  images: PropertyMedia[];
  title: string;
  listingKind: ListingKind;
  isFeatured: boolean;
  status: PropertyStatus;
}

/**
 * Property detail gallery — single hero on mobile, hero + 2×2 thumb grid on
 * desktop, with a "View all N photos" button and a full-screen lightbox.
 * Every tile is a button; clicking any one opens the lightbox at that index.
 */
export function PropertyGallery({
  images,
  title,
  listingKind,
  isFeatured,
  status,
}: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openAt = useCallback((i: number) => setLightboxIndex(i), []);
  const close = useCallback(() => setLightboxIndex(null), []);

  /* Hooks declared above so the rules-of-hooks lint stays satisfied —
   * the early return for the empty-gallery case can't come before them. */
  if (images.length === 0) return null;

  const total = images.length;
  const heroSet = images.slice(0, 5);
  const thumbs = heroSet.slice(1, 5);

  return (
    <>
      <div className={styles.gallery}>
        <button
          type="button"
          className={styles.heroTile}
          onClick={() => openAt(0)}
          aria-label="Open photo 1 in full view"
        >
          <Image
            src={heroSet[0]!.url}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className={styles.img}
          />
          <div className={styles.heroBadges}>
            <Badge tone={listingKind === 'new-project' ? 'new' : 'resale'}>
              {listingKind === 'new-project' ? 'New Project' : 'Resale'}
            </Badge>
            {isFeatured ? <Badge tone="featured">Featured</Badge> : null}
            {status === 'sold' ? <Badge tone="sold">Sold</Badge> : null}
          </div>
        </button>

        {thumbs.map((media, i) => {
          const isLastWithMore = i === thumbs.length - 1 && total > 5;
          return (
            <button
              key={media.id}
              type="button"
              className={cn(styles.thumbTile, styles[`thumb${i + 1}`])}
              onClick={() => openAt(i + 1)}
              aria-label={`Open photo ${i + 2} in full view`}
            >
              <Image
                src={media.url}
                alt={`${title} — photo ${i + 2}`}
                fill
                sizes="(max-width: 1024px) 50vw, 20vw"
                className={styles.img}
              />
              {isLastWithMore ? (
                <span className={styles.thumbOverlay}>
                  <GridIcon />+{total - 5} more
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          className={styles.viewAll}
          onClick={() => openAt(0)}
          aria-label={`View all ${total} photos`}
        >
          <GridIcon />
          <span>View all {total} photos</span>
        </button>
      </div>

      {lightboxIndex !== null ? (
        <PropertyImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          title={title}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="1.5"
        y="9"
        width="5.5"
        height="5.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="9"
        width="5.5"
        height="5.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
