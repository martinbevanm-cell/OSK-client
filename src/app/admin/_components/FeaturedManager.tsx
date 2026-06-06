'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  useListAdminPropertiesQuery,
  useSetPropertyFeaturedMutation,
} from '@/features/admin';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './FeaturedManager.module.scss';

type Tab = 'featured' | 'all';

export function FeaturedManager() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useListAdminPropertiesQuery({
    page,
    limit: 20,
    isFeatured: tab === 'featured' ? true : undefined,
  });
  const [setFeatured, { isLoading: saving }] = useSetPropertyFeaturedMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  const onToggle = async (id: string, next: boolean, title: string) => {
    setBusyId(id);
    try {
      await setFeatured({ id, isFeatured: next }).unwrap();
      dispatch(
        toastPushed(
          'success',
          next
            ? `Featured "${title}" on the home page.`
            : `Removed "${title}" from featured.`,
        ),
      );
    } catch {
      /* surfaced by the global toast */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Featured listings</span>
        <h1 className={styles.title}>Featured listings</h1>
        <p className={styles.sub}>
          Featured listings appear in the &ldquo;Curated&rdquo; band on the home page and
          surface first in search. There&rsquo;s no hard cap — keep the set small enough
          that &ldquo;featured&rdquo; still means something.
        </p>
      </header>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={cn(styles.tab, tab === 'all' && styles.tabOn)}
          onClick={() => {
            setTab('all');
            setPage(1);
          }}
        >
          All published
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'featured'}
          className={cn(styles.tab, tab === 'featured' && styles.tabOn)}
          onClick={() => {
            setTab('featured');
            setPage(1);
          }}
        >
          Currently featured
        </button>
      </div>

      {isLoading ? (
        <p className={styles.muted}>Loading listings…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load listings.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          {tab === 'featured'
            ? 'Nothing is featured yet. Switch to All published to promote a listing.'
            : 'No listings match this filter.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((p) => (
            <li key={p.id} className={cn(styles.row, p.isFeatured && styles.rowFeatured)}>
              <Link
                href={`/property/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className={styles.media}
              >
                <Image
                  src={p.thumbnail}
                  alt={p.title}
                  fill
                  sizes="120px"
                  className={styles.thumb}
                />
              </Link>
              <div className={styles.copy}>
                <p className={styles.meta}>
                  {p.locality} · {p.city} · <span className={styles.type}>{p.type}</span>
                </p>
                <Link
                  href={`/property/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.itemTitle}
                >
                  {p.title}
                </Link>
                <p className={styles.price}>
                  {formatPrice(p.price, p.currency)}
                  {p.type === 'rental' ? ' /mo' : ''}
                </p>
              </div>

              <div className={styles.actions}>
                {p.isFeatured ? (
                  <span className={styles.featuredBadge}>★ Featured</span>
                ) : null}
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={p.isFeatured}
                    disabled={saving || busyId === p.id}
                    onChange={(e) => onToggle(p.id, e.target.checked, p.title)}
                  />
                  <span className={styles.toggleTrack} aria-hidden="true">
                    <span className={styles.toggleThumb} />
                  </span>
                  <span className={styles.toggleLabel}>
                    {busyId === p.id ? 'Saving…' : p.isFeatured ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!canPrev}
            onClick={() => setPage((n) => Math.max(1, n - 1))}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.pages} · {meta.total} total
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!canNext}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
