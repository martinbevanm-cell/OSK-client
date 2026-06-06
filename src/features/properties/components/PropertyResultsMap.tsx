'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PropertySummary } from '@contracts';
import { formatUSDCompact } from '@/components/home/heroSearch.data';
import styles from './PropertyResultsMap.module.scss';

interface PropertyResultsMapProps {
  properties: PropertySummary[];
}

const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Listings map. Renders one price-pill marker per property and fits the
 * initial viewport to all markers. Clicking a marker routes to the detail
 * page. MapLibre + OpenFreeMap — no API key, no card.
 */
export function PropertyResultsMap({ properties }: PropertyResultsMapProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const styleUrl =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? DEFAULT_STYLE_URL;

  const center = useMemo(() => {
    if (properties.length === 0) return null;
    let west = Infinity,
      south = Infinity,
      east = -Infinity,
      north = -Infinity;
    for (const p of properties) {
      const [lng, lat] = p.location.coordinates;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
    /* a rough zoom that fits the bbox; works fine for the U.S.-wide set */
    const span = Math.max(east - west, north - south);
    const zoom =
      span > 50 ? 2.5 : span > 20 ? 3.5 : span > 8 ? 4.5 : span > 2 ? 6 : 10;
    return {
      longitude: (west + east) / 2,
      latitude: (south + north) / 2,
      zoom,
    };
  }, [properties]);

  if (properties.length === 0) {
    return (
      <div className={styles.shell}>
        <div className={styles.empty}>No mappable listings.</div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {!mounted || !center ? (
        <div className={styles.placeholder}>Loading map…</div>
      ) : (
        <Map
          initialViewState={center}
          mapStyle={styleUrl}
          style={{ width: '100%', height: '100%' }}
          reuseMaps
          dragRotate={false}
          touchPitch={false}
          pitchWithRotate={false}
          attributionControl
        >
          <NavigationControl position="top-right" showCompass={false} />
          {properties.map((p) => {
            const [lng, lat] = p.location.coordinates;
            return (
              <Marker
                key={p.id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
              >
                <button
                  type="button"
                  className={styles.pill}
                  onClick={() => router.push(`/property/${p.slug}`)}
                  aria-label={`${p.title} — ${formatUSDCompact(p.price)}`}
                  title={p.title}
                >
                  {formatUSDCompact(p.price)}
                </button>
              </Marker>
            );
          })}
        </Map>
      )}
    </div>
  );
}
