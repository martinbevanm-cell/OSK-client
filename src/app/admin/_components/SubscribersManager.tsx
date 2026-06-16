'use client';

import { useState } from 'react';
import {
  useListSubscribersQuery,
  useUnsubscribeSubscriberMutation,
  type NewsletterSubscriber,
} from '@/features/marketing';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './SubscribersManager.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Admin subscribers manager.
 *
 *  - Search by email substring.
 *  - Filter by status (active / unsubscribed / all).
 *  - One-click CSV export of the full list (no pagination).
 *  - Per-row unsubscribe (soft — sets unsubscribedAt).
 * ──────────────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function SubscribersManager() {
  const dispatch = useAppDispatch();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'active' | 'unsubscribed' | 'all'>('active');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useListSubscribersQuery({
    page,
    limit: 50,
    q: q.trim() || undefined,
    status,
  });
  const [unsubscribe, { isLoading: removing }] = useUnsubscribeSubscriberMutation();

  const items = data?.items ?? [];
  const meta = data?.meta;
  const activeTotal = data?.activeTotal ?? 0;

  const onUnsubscribe = async (sub: NewsletterSubscriber) => {
    if (sub.unsubscribedAt) return;
    try {
      await unsubscribe(sub.id).unwrap();
      dispatch(toastPushed('success', `Unsubscribed ${sub.email}.`));
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Subscribers</span>
        <h1 className={styles.title}>Newsletter subscribers</h1>
        <p className={styles.sub}>
          Everyone who signed up through the newsletter strip on the public site.{' '}
          <strong>{activeTotal.toLocaleString('en-US')}</strong> currently active.
        </p>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search by email…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className={styles.filterBar} role="tablist">
          {(['active', 'unsubscribed', 'all'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              className={cn(styles.filterBtn, status === key && styles.filterBtnActive)}
              onClick={() => {
                setStatus(key);
                setPage(1);
              }}
            >
              {key === 'active'
                ? 'Active'
                : key === 'unsubscribed'
                  ? 'Unsubscribed'
                  : 'All'}
            </button>
          ))}
        </div>
        <a
          className={styles.exportBtn}
          href={`${API_BASE}/admin/subscribers/export.csv`}
          /* Triggers a file download via Content-Disposition header on
           *  the response. Browsers respect the admin's existing
           *  session cookie automatically. */
        >
          Export CSV
        </a>
      </div>

      {isLoading ? (
        <p className={styles.muted}>Loading subscribers…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load the subscriber list.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>No subscribers match this filter yet.</p>
      ) : (
        <div className={cn(styles.tableWrap, isFetching && styles.busy)}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Subscribed</th>
                <th>Status</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {items.map((sub) => (
                <tr key={sub.id}>
                  <td className={styles.email}>
                    <a href={`mailto:${sub.email}`}>{sub.email}</a>
                  </td>
                  <td className={styles.source}>{sub.source || '—'}</td>
                  <td>{formatDate(sub.createdAt)}</td>
                  <td>
                    {sub.unsubscribedAt ? (
                      <span className={cn(styles.statusPill, styles.toneOff)}>
                        Unsubscribed
                      </span>
                    ) : (
                      <span className={cn(styles.statusPill, styles.toneOn)}>Active</span>
                    )}
                  </td>
                  <td className={styles.actionsCell}>
                    {sub.unsubscribedAt ? null : (
                      <button
                        type="button"
                        className={styles.unsubBtn}
                        disabled={removing}
                        onClick={() => onUnsubscribe(sub)}
                      >
                        Unsubscribe
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.pages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
