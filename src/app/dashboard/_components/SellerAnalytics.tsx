'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useGetMyAnalyticsQuery } from '@/features/properties/propertiesApi';
import { selectSavedItems } from '@/features/saved';
import { useAppSelector } from '@/store/hooks';
import styles from './SellerAnalytics.module.scss';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function SellerAnalytics() {
  const { data, isLoading, isError } = useGetMyAnalyticsQuery();
  /* `Saved` is a client-only feature persisted to localStorage, so we
   * surface the local count too — it's an additional signal of buyer
   * interest the user can scan at a glance. */
  const savedItems = useAppSelector(selectSavedItems);

  if (isLoading) {
    return (
      <section className={styles.shell}>
        <Head />
        <p className={styles.muted}>Loading analytics…</p>
      </section>
    );
  }
  if (isError || !data) {
    return (
      <section className={styles.shell}>
        <Head />
        <p className={styles.muted}>Couldn&rsquo;t load analytics.</p>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <Head />

      <div className={styles.totals}>
        <Stat
          label="Total views"
          value={fmt(data.totals.views)}
          hint="Across every listing you own."
        />
        <Stat
          label="Total inquiries"
          value={fmt(data.totals.inquiries)}
          hint="Leads via every contact channel."
        />
        <Stat
          label="Active listings"
          value={fmt(data.totals.listings)}
          hint="All statuses — drafts to sold."
        />
        <Stat
          label="Saved on this device"
          value={fmt(savedItems.length)}
          hint="Listings you've bookmarked yourself (local)."
        />
      </div>

      {data.items.length === 0 ? (
        <p className={styles.muted}>
          You haven&rsquo;t posted a listing yet — your analytics will appear here as soon
          as you do.
        </p>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Listing</span>
            <span>Status</span>
            <span className={styles.numCol}>Views</span>
            <span className={styles.numCol}>Inquiries</span>
            <span className={styles.numCol}>Convert</span>
          </div>
          {data.items.map((row) => {
            const conversion = row.views > 0 ? (row.inquiries / row.views) * 100 : 0;
            return (
              <div key={row.id} className={styles.row}>
                <Link
                  href={`/property/${row.slug}`}
                  className={styles.listing}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className={styles.thumb}>
                    <Image
                      src={row.thumbnail}
                      alt={row.title}
                      fill
                      sizes="56px"
                      className={styles.thumbImg}
                    />
                  </span>
                  <span className={styles.title}>{row.title}</span>
                </Link>
                <span
                  className={`${styles.status} ${styles[`status_${row.status}`] ?? ''}`}
                >
                  {row.status}
                </span>
                <span className={styles.num}>{fmt(row.views)}</span>
                <span className={styles.num}>{fmt(row.inquiries)}</span>
                <span className={styles.num}>
                  {conversion > 0 ? `${conversion.toFixed(1)}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Head() {
  return (
    <header className={styles.head}>
      <span className={styles.eyebrow}>Dashboard · Analytics</span>
      <h1 className={styles.title}>Listing performance</h1>
      <p className={styles.sub}>
        Per-listing views and inquiries. Counts update in near real time; return visits in
        the same browser tab don&rsquo;t double-count.
      </p>
    </header>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {hint ? <p className={styles.statHint}>{hint}</p> : null}
    </div>
  );
}
