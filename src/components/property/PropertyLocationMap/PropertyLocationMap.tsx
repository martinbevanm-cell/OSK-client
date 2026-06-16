'use client';

import { useEffect, useState } from 'react';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './PropertyLocationMap.module.scss';

interface PropertyLocationMapProps {
  longitude: number;
  latitude: number;
  /** Aria label for the pin (e.g. "Loft Residence at 17 Reade"). */
  label: string;
  /** Optional caption shown in a floating chip over the map. */
  caption?: string;
}

const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Single-marker map for the property detail page.
 *  ▸ Renders only after mount (avoids SSR mismatches and downloads).
 *  ▸ MapLibre GL + OpenFreeMap tiles — no API key, no credit card.
 *  ▸ Marker and chrome are token-themed; no hardcoded colors.
 */
export function PropertyLocationMap({
  longitude,
  latitude,
  label,
  caption,
}: PropertyLocationMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const styleUrl =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? DEFAULT_STYLE_URL;

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className={styles.shell}>
      {!mounted ? (
        <div className={styles.placeholder} aria-hidden="true">
          <span>Loading map…</span>
        </div>
      ) : (
        <Map
          initialViewState={{ longitude, latitude, zoom: 14 }}
          mapStyle={styleUrl}
          style={{ width: '100%', height: '100%' }}
          reuseMaps
          dragRotate={false}
          touchPitch={false}
          pitchWithRotate={false}
          attributionControl
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Marker longitude={longitude} latitude={latitude} anchor="bottom">
            <div className={styles.marker} role="img" aria-label={label}>
              <svg viewBox="0 0 32 44" width="36" height="48">
                <defs>
                  <filter
                    id="osk-pin-shadow"
                    x="-50%"
                    y="-20%"
                    width="200%"
                    height="160%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="2"
                      floodOpacity="0.3"
                    />
                  </filter>
                </defs>
                <path
                  filter="url(#osk-pin-shadow)"
                  className={styles.pinBody}
                  d="M16 0C7.16 0 0 7.06 0 15.78 0 27.6 14.39 42.4 15 43.04a1.4 1.4 0 0 0 2 0c.61-.64 15-15.45 15-27.27C32 7.06 24.84 0 16 0z"
                />
                <circle
                  className={styles.pinDot}
                  cx="16"
                  cy="15.78"
                  r="5.5"
                />
              </svg>
            </div>
          </Marker>
        </Map>
      )}

      {caption ? (
        <div className={styles.caption}>
          <span className={styles.captionDot} aria-hidden="true" />
          {caption}
        </div>
      ) : null}

      <a
        className={styles.directions}
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5L17.5 11z"
            fill="currentColor"
          />
        </svg>
        Open in Maps
      </a>
    </div>
  );
}
