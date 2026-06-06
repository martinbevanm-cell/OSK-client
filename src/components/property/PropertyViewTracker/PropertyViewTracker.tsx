'use client';

import { useEffect } from 'react';
import { useRecordPropertyViewMutation } from '@/features/properties/propertiesApi';

const KEY_PREFIX = 'osk.view:';

interface Props {
  propertyId: string;
}

/**
 * Silently bumps the view counter once per (tab × listing). Uses
 * sessionStorage so rapid back/forward navigation doesn't double-count.
 * Cleared when the tab closes — a return visit tomorrow counts again.
 */
export function PropertyViewTracker({ propertyId }: Props) {
  const [recordView] = useRecordPropertyViewMutation();

  useEffect(() => {
    if (!propertyId) return;
    if (typeof window === 'undefined') return;
    const key = `${KEY_PREFIX}${propertyId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* private mode etc. — fall through and still record. */
    }
    void recordView(propertyId).catch(() => {
      /* analytics is best-effort — never surface to users. */
    });
  }, [propertyId, recordView]);

  return null;
}
