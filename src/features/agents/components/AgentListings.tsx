'use client';

import { useState } from 'react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui';
import { useListAgentListingsQuery } from '../agentsApi';
import styles from './AgentListings.module.scss';

interface AgentListingsProps {
  agentId: string;
  initialLimit?: number;
}

/**
 * Public listings owned by a single agent — paginated grid that reuses
 * PropertyCard so contact UX matches the rest of the site.
 */
export function AgentListings({ agentId, initialLimit = 9 }: AgentListingsProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useListAgentListingsQuery({
    id: agentId,
    page,
    limit: initialLimit,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  if (isLoading) {
    return <p className={styles.muted}>Loading listings…</p>;
  }
  if (isError) {
    return (
      <p className={styles.muted}>Couldn&rsquo;t load this agent&rsquo;s listings.</p>
    );
  }
  if (items.length === 0) {
    return (
      <p className={styles.muted}>
        This agent doesn&rsquo;t have any published listings right now.
      </p>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.grid}>
        {items.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage((n) => Math.max(1, n - 1))}
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
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
