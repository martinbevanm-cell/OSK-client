'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PropertySummary } from '@contracts';
import {
  useApprovePropertyAdminMutation,
  useListPendingPropertiesQuery,
  useRejectPropertyAdminMutation,
} from '@/features/admin';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { RejectReasonDialog } from './RejectReasonDialog';
import styles from './ModerationQueue.module.scss';

/**
 * Active rejection request — either a single listing or a bulk set.
 * Stored as state so the modal can mount in a single place and the
 * row + toolbar handlers both push the same shape.
 */
type RejectTarget =
  | { kind: 'single'; listing: PropertySummary }
  | { kind: 'bulk'; ids: string[] };

export function ModerationQueue() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useListPendingPropertiesQuery({
    page,
    limit: 12,
  });
  const [approve, approveState] = useApprovePropertyAdminMutation();
  const [reject, rejectState] = useRejectPropertyAdminMutation();

  /* Per-row busy state (single-action UX). */
  const [busyId, setBusyId] = useState<string | null>(null);
  /* Multi-select state — set of property ids. */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /* Bulk-mode progress for the toolbar buttons. */
  const [bulkRunning, setBulkRunning] = useState<'approve' | 'reject' | null>(null);
  /* Holds the rejection request currently being typed. `null` =
   * dialog closed. */
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);

  /* Memoize so the effect below doesn't see a fresh array on every render
   * (which would re-run on every re-render and churn the selection set). */
  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  /* Drop selections that disappear after a page change or invalidation. */
  useEffect(() => {
    setSelected((prev) => {
      const stillThere = new Set<string>();
      for (const id of prev) {
        if (items.some((p) => p.id === id)) stillThere.add(id);
      }
      return stillThere.size === prev.size ? prev : stillThere;
    });
  }, [items]);

  const allChecked = items.length > 0 && selected.size === items.length;
  const someChecked = selected.size > 0;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((p) => p.id)),
    );

  const onAction = async (listing: PropertySummary, decision: 'approve' | 'reject') => {
    /* Reject opens the dedicated reason dialog — the request
     * actually fires from the dialog's onConfirm. Approve has no
     * reason and fires immediately. */
    if (decision === 'reject') {
      setRejectTarget({ kind: 'single', listing });
      return;
    }

    setBusyId(listing.id);
    try {
      await approve(listing.id).unwrap();
      dispatch(toastPushed('success', `Approved “${listing.title}”.`));
    } catch {
      /* surfaced by the global toast */
    } finally {
      setBusyId(null);
    }
  };

  /* Called by the dialog when the admin confirms a rejection. Routes
   * to the single or bulk code path depending on `rejectTarget.kind`,
   * keeps the dialog visible while submitting so the spinner shows. */
  const onRejectConfirmed = async (reason: string) => {
    if (!rejectTarget) return;

    if (rejectTarget.kind === 'single') {
      const { listing } = rejectTarget;
      setBusyId(listing.id);
      try {
        await reject({ id: listing.id, reason }).unwrap();
        dispatch(toastPushed('success', `Rejected “${listing.title}”.`));
        setRejectTarget(null);
      } catch {
        /* surfaced by the global toast — keep dialog open so the
         * admin can retry without re-typing. */
      } finally {
        setBusyId(null);
      }
      return;
    }

    /* Bulk path — fire requests serially so the rate limiter / DB
     * stay calm. Toast summarises ok/fail counts. */
    const { ids } = rejectTarget;
    setBulkRunning('reject');
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await reject({ id, reason }).unwrap();
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkRunning(null);
    setSelected(new Set());
    setRejectTarget(null);
    dispatch(
      toastPushed(
        fail === 0 ? 'success' : 'error',
        `${ok} rejected${fail > 0 ? `, ${fail} failed` : ''}.`,
      ),
    );
  };

  /* Bulk run — approves fire immediately (no reason needed). Reject
   * hands off to the dialog which collects one reason for every
   * selected row. */
  const bulkRun = async (decision: 'approve' | 'reject') => {
    if (selected.size === 0) return;
    const ids = items.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;

    if (decision === 'reject') {
      setRejectTarget({ kind: 'bulk', ids });
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Approve ${ids.length} listing${ids.length === 1 ? '' : 's'}?`)
    ) {
      return;
    }
    setBulkRunning('approve');
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await approve(id).unwrap();
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkRunning(null);
    setSelected(new Set());
    dispatch(
      toastPushed(
        fail === 0 ? 'success' : 'error',
        `${ok} approved${fail > 0 ? `, ${fail} failed` : ''}.`,
      ),
    );
  };

  const mutating = approveState.isLoading || rejectState.isLoading;

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Moderation</span>
        <h1 className={styles.title}>Listings pending review</h1>
        <p className={styles.sub}>
          Approve to publish, or reject to send the listing back to the seller. Select
          multiple rows to clear them in one pass.
        </p>
      </header>

      {/* ── bulk toolbar ──────────────────────────────────────────── */}
      {items.length > 0 ? (
        <div
          className={cn(styles.bulkBar, someChecked && styles.bulkBarOn)}
          role="region"
          aria-label="Bulk actions"
        >
          <label className={styles.bulkSelectAll}>
            <input
              type="checkbox"
              checked={allChecked}
              ref={(el) => {
                if (el) el.indeterminate = someChecked && !allChecked;
              }}
              onChange={toggleAll}
            />
            <span>
              {someChecked ? `${selected.size} selected` : `Select all on this page`}
            </span>
          </label>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.approve}
              disabled={!someChecked || bulkRunning !== null || mutating}
              onClick={() => bulkRun('approve')}
            >
              {bulkRunning === 'approve'
                ? `Approving ${selected.size}…`
                : `Approve selected`}
            </button>
            <button
              type="button"
              className={styles.reject}
              disabled={!someChecked || bulkRunning !== null || mutating}
              onClick={() => bulkRun('reject')}
            >
              {bulkRunning === 'reject'
                ? `Rejecting ${selected.size}…`
                : `Reject selected`}
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className={styles.muted}>Loading queue…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load the moderation queue.</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Inbox zero.</p>
          <p className={styles.emptySub}>
            Nothing waiting on you right now. New submissions land here in real time.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((p) => {
            const checked = selected.has(p.id);
            return (
              <li key={p.id} className={cn(styles.row, checked && styles.rowChecked)}>
                <label className={styles.rowCheck}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(p.id)}
                    aria-label={`Select ${p.title}`}
                  />
                </label>
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
                    sizes="160px"
                    className={styles.thumb}
                  />
                </Link>

                <div className={styles.copy}>
                  <p className={styles.rowMeta}>
                    {p.locality} · {p.city} ·{' '}
                    <span className={styles.rowType}>{p.type}</span>
                  </p>
                  <Link
                    href={`/property/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.rowTitle}
                  >
                    {p.title}
                  </Link>
                  <p className={styles.rowPrice}>
                    {formatPrice(p.price, p.currency)}
                    {p.type === 'rental' ? ' /mo' : ''}
                  </p>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.approve}
                    onClick={() => onAction(p, 'approve')}
                    disabled={mutating || busyId === p.id || bulkRunning !== null}
                  >
                    {busyId === p.id && approveState.isLoading ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className={styles.reject}
                    onClick={() => onAction(p, 'reject')}
                    disabled={mutating || busyId === p.id || bulkRunning !== null}
                  >
                    {busyId === p.id && rejectState.isLoading ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </li>
            );
          })}
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

      {/* ─── reject reason dialog (single + bulk) ───────────────────── */}
      <RejectReasonDialog
        open={rejectTarget !== null}
        title={
          rejectTarget?.kind === 'single'
            ? `Reject “${rejectTarget.listing.title}”`
            : rejectTarget?.kind === 'bulk'
              ? `Reject ${rejectTarget.ids.length} listing${rejectTarget.ids.length === 1 ? '' : 's'}`
              : ''
        }
        subtitle={
          rejectTarget?.kind === 'bulk'
            ? 'The same reason is sent to every seller via email and shows on their dashboard.'
            : 'The seller sees this verbatim in an email and on their dashboard.'
        }
        submitting={rejectState.isLoading || bulkRunning === 'reject'}
        onCancel={() => setRejectTarget(null)}
        onConfirm={onRejectConfirmed}
      />
    </section>
  );
}
