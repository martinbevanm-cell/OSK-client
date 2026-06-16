'use client';

import { useState } from 'react';
import type { AuditAction, AuditEntry } from '@contracts';
import { useListAuditLogsQuery } from '@/features/admin';
import styles from './AuditLog.module.scss';

const ACTION_LABELS: Record<AuditAction, string> = {
  'user.role.update': 'changed role',
  'user.status.update': 'changed status',
  'property.approve': 'approved listing',
  'property.reject': 'rejected listing',
  'review.delete': 'removed review',
};

const ACTION_TONE: Record<AuditAction, 'good' | 'warn' | 'info'> = {
  'user.role.update': 'info',
  'user.status.update': 'warn',
  'property.approve': 'good',
  'property.reject': 'warn',
  'review.delete': 'warn',
};

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function describeMeta(entry: AuditEntry): string {
  const meta = entry.meta ?? {};
  if (
    entry.action === 'user.role.update' ||
    entry.action === 'user.status.update'
  ) {
    const before = meta.before as string | undefined;
    const after = meta.after as string | undefined;
    if (before && after) return `${before} → ${after}`;
  }
  if (
    entry.action === 'property.approve' ||
    entry.action === 'property.reject'
  ) {
    const title = meta.title as string | undefined;
    if (title) return `“${title}”`;
  }
  if (entry.action === 'review.delete') {
    const rating = meta.rating as number | undefined;
    if (rating != null) return `${rating}★ review`;
  }
  return '';
}

export function AuditLog() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useListAuditLogsQuery({
    page,
    limit: 30,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Audit</span>
        <h1 className={styles.title}>Activity log</h1>
        <p className={styles.sub}>
          Every privileged action — role and status changes, property
          moderation, review takedowns. Entries auto-expire after 365 days.
        </p>
      </header>

      {isLoading ? (
        <p className={styles.muted}>Loading activity…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load the audit log.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No audit entries yet. Admin actions will appear here as soon as
          they happen.
        </p>
      ) : (
        <ol className={styles.feed}>
          {items.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <span
                className={`${styles.dot} ${styles[`dot_${ACTION_TONE[entry.action]}`]}`}
                aria-hidden="true"
              />
              <div className={styles.body}>
                <p className={styles.line}>
                  <span className={styles.actor}>{entry.actorName}</span>{' '}
                  <span className={styles.verb}>
                    {ACTION_LABELS[entry.action]}
                  </span>{' '}
                  {describeMeta(entry) ? (
                    <span className={styles.detail}>{describeMeta(entry)}</span>
                  ) : null}
                </p>
                <p className={styles.meta}>
                  {entry.entityType} · {entry.entityId.slice(-6)} ·{' '}
                  <time dateTime={entry.createdAt}>
                    {formatWhen(entry.createdAt)}
                  </time>
                  {entry.ip ? ` · ${entry.ip}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
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
            Page {meta.page} of {meta.pages} · {meta.total} events
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
