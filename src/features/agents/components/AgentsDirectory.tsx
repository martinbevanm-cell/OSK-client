'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useListAgentsQuery } from '../agentsApi';
import styles from './AgentsDirectory.module.scss';

interface AgentsDirectoryProps {
  initialLimit?: number;
}

/**
 * Public list of OSK agents. Live from the backend with a tiny client-side
 * search filter and a Load more button.
 */
export function AgentsDirectory({ initialLimit = 12 }: AgentsDirectoryProps) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useListAgentsQuery({
    q: q.trim() || undefined,
    page,
    limit: initialLimit,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  return (
    <section className={styles.shell}>
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.search}
          value={q}
          placeholder="Search agents by name or email"
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <span className={styles.count}>
          {meta
            ? `${meta.total.toLocaleString('en-US')} ${
                meta.total === 1 ? 'agent' : 'agents'
              }`
            : '—'}
        </span>
      </div>

      {isLoading ? (
        <p className={styles.muted}>Loading agents…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load the directory.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No agents match {q.trim() ? `“${q.trim()}”` : 'your search'} yet.
        </p>
      ) : (
        <ul className={styles.grid}>
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/agents/${a.id}`} className={styles.card}>
                <span className={styles.avatar} aria-hidden="true">
                  {a.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(a.avatarUrl)}
                      alt=""
                      className={styles.avatarImg}
                    />
                  ) : (
                    a.name
                      .split(/\s+/)
                      .map((s) => s[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </span>
                <div className={styles.cardCopy}>
                  <p className={styles.cardName}>{a.name}</p>
                  <p className={styles.cardMeta}>
                    OSK agent · Joined{' '}
                    {new Date(a.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={styles.cardArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}

      <p className={cn(styles.muted, styles.footnote)}>
        OSK verifies every agent before they appear here. Profiles get richer
        bios, specialties and metrics in a coming release.
      </p>
    </section>
  );
}
