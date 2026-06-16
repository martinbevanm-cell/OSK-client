'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PropertyStatus } from '@contracts';
import {
  useDeletePropertyMutation,
  useListMyPropertiesQuery,
  useMarkPropertySoldMutation,
  useReopenPropertyMutation,
  useSubmitPropertyForReviewMutation,
} from '@/features/properties';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Badge, Button, ConfirmDangerDialog } from '@/components/ui';
import { formatPrice, formatArea } from '@/lib/format';
import { cn } from '@/lib/cn';
import styles from './MyListings.module.scss';

type DeleteTarget = { id: string; title: string };

const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: 'Draft',
  'pending-review': 'In review',
  approved: 'Approved',
  'awaiting-payment': 'Awaiting payment', // legacy — admin re-approval clears these
  rejected: 'Rejected',
  published: 'Published',
  sold: 'Sold',
  archived: 'Archived',
};

const STATUS_TONE: Record<PropertyStatus, 'new' | 'resale' | 'featured' | 'sold'> = {
  draft: 'resale',
  'pending-review': 'featured',
  approved: 'new',
  'awaiting-payment': 'featured',
  rejected: 'sold',
  published: 'new',
  sold: 'sold',
  archived: 'sold',
};

const PAGE_SIZE = 12;

export function MyListings() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useListMyPropertiesQuery({
    page,
    limit: PAGE_SIZE,
  });
  const [submitForReview, submitState] = useSubmitPropertyForReviewMutation();
  const [markSold, soldState] = useMarkPropertySoldMutation();
  const [reopen, reopenState] = useReopenPropertyMutation();
  const [deleteProperty, deleteState] = useDeletePropertyMutation();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const onSubmit = async (id: string) => {
    try {
      await submitForReview(id).unwrap();
      dispatch(toastPushed('success', 'Listing submitted for review.'));
    } catch {
      /* surfaced by the global error toast handles this */
    }
  };

  const onMarkSold = async (id: string, title: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Mark "${title}" as sold? It will stop appearing in public search. You can re-open it later if needed.`,
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      await markSold(id).unwrap();
      dispatch(toastPushed('success', `"${title}" marked as sold.`));
    } catch {
      /* surfaced by the global error toast */
    } finally {
      setBusyId(null);
    }
  };

  const onDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      await deleteProperty(target.id).unwrap();
      dispatch(
        toastPushed(
          'success',
          `"${target.title}" deleted. Your plan slot is now free for another listing.`,
        ),
      );
      setDeleteTarget(null);
    } catch {
      /* surfaced by the global toast; leave dialog open for retry */
    }
  };

  const onReopen = async (id: string, title: string) => {
    setBusyId(id);
    try {
      await reopen(id).unwrap();
      dispatch(
        toastPushed(
          'success',
          `"${title}" re-opened as a draft. Edit and re-submit for review when ready.`,
        ),
      );
    } catch {
      /* surfaced by the global error toast */
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <div className={styles.headCopy}>
          <span className={styles.eyebrow}>Inventory</span>
          <h1 className={styles.title}>My listings</h1>
          <p className={styles.sub}>
            Edit drafts, submit for review and watch listings go live.
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <Button size="lg">+ New listing</Button>
        </Link>
      </header>

      {isLoading ? (
        <p className={styles.state}>Loading…</p>
      ) : isError ? (
        <p className={styles.state}>Couldn&rsquo;t load your listings.</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No listings yet</p>
          <p className={styles.emptyMsg}>
            Start a listing and your draft will appear here.
          </p>
          <Link href="/dashboard/listings/new">
            <Button size="lg">Start a listing</Button>
          </Link>
        </div>
      ) : (
        <div className={cn(styles.table, isFetching && styles.busy)}>
          <div className={styles.tableHead}>
            <span>Listing</span>
            <span>Price</span>
            <span>Size</span>
            <span>Status</span>
            <span aria-hidden="true" />
          </div>

          <ul className={styles.rows}>
            {items.map((p) => {
              const status = p.status as PropertyStatus;
              const canSubmit = status === 'draft' || status === 'rejected';
              return (
                <li
                  key={p.id}
                  className={cn(styles.row, status === 'rejected' && styles.rowRejected)}
                >
                  {/* Rejection banner spans the full row so the
                   * seller can't miss it. Renders even when the
                   * reason is empty (legacy data) so the row still
                   * communicates "rejected" + invites a resubmit. */}
                  {status === 'rejected' ? (
                    <div className={styles.rejectionBanner} role="status">
                      <div className={styles.rejectionHead}>
                        <span className={styles.rejectionIcon} aria-hidden="true">
                          <svg viewBox="0 0 16 16" width="16" height="16">
                            <circle
                              cx="8"
                              cy="8"
                              r="7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M8 4v5M8 11.5v.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        <span className={styles.rejectionTitle}>
                          Listing rejected
                          {p.rejectedAt
                            ? ` · ${new Date(p.rejectedAt).toLocaleDateString('en-US', {
                                dateStyle: 'medium',
                              })}`
                            : ''}
                        </span>
                      </div>
                      {p.rejectionReason ? (
                        <p className={styles.rejectionBody}>{p.rejectionReason}</p>
                      ) : (
                        <p className={styles.rejectionBody}>
                          The reviewer didn&rsquo;t include a written reason. Edit the
                          listing and submit it again — or contact support if you&rsquo;re
                          unsure what to change.
                        </p>
                      )}
                      <p className={styles.rejectionHint}>
                        Edit the listing below, then click <strong>Submit</strong> to send
                        it back for review.
                      </p>
                    </div>
                  ) : null}
                  <div className={styles.cellListing}>
                    <p className={styles.listingTitle}>
                      <Link href={`/property/${p.slug}`} className={styles.listingLink}>
                        {p.title}
                      </Link>
                    </p>
                    <p className={styles.listingMeta}>
                      {p.locality}, {p.city}
                    </p>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.cellLabel}>Price</span>
                    <span className={styles.price}>
                      {formatPrice(p.price, p.currency)}
                    </span>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.cellLabel}>Size</span>
                    <span>{formatArea(p.areaSqft) ?? '—'}</span>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.cellLabel}>Status</span>
                    <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                  </div>
                  <div className={styles.cellAction}>
                    <Link
                      href={`/dashboard/listings/${p.slug}/edit`}
                      className={styles.viewLink}
                    >
                      Edit
                    </Link>
                    {canSubmit ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={submitState.isLoading}
                        onClick={() => onSubmit(p.id)}
                      >
                        Submit
                      </Button>
                    ) : status === 'published' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={soldState.isLoading || busyId === p.id}
                        onClick={() => onMarkSold(p.id, p.title)}
                      >
                        {busyId === p.id ? 'Saving…' : 'Mark sold'}
                      </Button>
                    ) : status === 'sold' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={reopenState.isLoading || busyId === p.id}
                        onClick={() => onReopen(p.id, p.title)}
                      >
                        {busyId === p.id ? 'Opening…' : 'Re-open'}
                      </Button>
                    ) : (
                      <Link href={`/property/${p.slug}`} className={styles.viewLink}>
                        View →
                      </Link>
                    )}
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      disabled={deleteState.isLoading}
                      onClick={() => setDeleteTarget({ id: p.id, title: p.title })}
                      title={`Delete "${p.title}" permanently`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <Button
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
            variant="secondary"
            size="sm"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}

      {deleteTarget ? (
        <ConfirmDangerDialog
          title={`Delete "${deleteTarget.title}"?`}
          description="This permanently removes the listing from OSK."
          consequences={[
            'The listing disappears from search and your dashboard.',
            'All inquiries and messages received about this listing are deleted.',
            'Any reviews left on the listing are removed.',
            'The slot it occupies in your plan is freed up, so you can list another property in its place.',
          ]}
          confirmLabel="Delete listing permanently"
          busy={deleteState.isLoading}
          onConfirm={onDeleteConfirmed}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </section>
  );
}
