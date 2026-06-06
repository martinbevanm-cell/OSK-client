'use client';

import { useState } from 'react';
import type { Inquiry, InquiryStatus } from '@contracts';
import {
  useListInquiriesQuery,
  useUpdateInquiryStatusMutation,
} from '@/features/inquiries';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './MyInquiries.module.scss';

const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  call: 'Call',
  whatsapp: 'WhatsApp',
  chat: 'Chat',
};

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'callback-requested', label: 'Callback' },
  { value: 'closed', label: 'Closed' },
];

const CHANNEL_FILTERS: { value: 'all' | Inquiry['channel']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'chat', label: 'Chat' },
];

const STATUS_FILTERS: { value: 'all' | InquiryStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'callback-requested', label: 'Callback' },
  { value: 'closed', label: 'Closed' },
];

const PAGE_SIZE = 12;

interface MyInquiriesProps {
  /** Switch header copy + page label to admin mode. Backend already
   * widens scope to all inquiries when the requester is an admin. */
  adminMode?: boolean;
}

export function MyInquiries({ adminMode = false }: MyInquiriesProps = {}) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState<'all' | Inquiry['channel']>('all');
  const [status, setStatus] = useState<'all' | InquiryStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useListInquiriesQuery({
    page,
    limit: PAGE_SIZE,
    channel: channel === 'all' ? undefined : channel,
    status: status === 'all' ? undefined : status,
  });
  const [updateStatus, updateState] = useUpdateInquiryStatusMutation();

  const items = data?.items ?? [];
  const meta = data?.meta;

  const onChangeStatus = async (id: string, next: InquiryStatus) => {
    try {
      await updateStatus({ id, body: { status: next } }).unwrap();
      dispatch(toastPushed('success', 'Inquiry status updated.'));
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <div className={styles.headCopy}>
          <span className={styles.eyebrow}>{adminMode ? 'Admin · Leads' : 'Leads'}</span>
          <h1 className={styles.title}>
            {adminMode ? 'Platform inquiries' : 'Inquiries'}
          </h1>
          <p className={styles.sub}>
            {adminMode
              ? 'Every inquiry across every listing on OSK. Sellers manage their own from the dashboard — this is the global view.'
              : 'Every email, callback request and chat lead lands here.'}
          </p>
        </div>
      </header>

      <div className={styles.filters}>
        <FilterPills
          label="Channel"
          options={CHANNEL_FILTERS}
          value={channel}
          onChange={(v) => {
            setChannel(v as typeof channel);
            setPage(1);
          }}
        />
        <FilterPills
          label="Status"
          options={STATUS_FILTERS}
          value={status}
          onChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p className={styles.state}>Loading…</p>
      ) : isError ? (
        <p className={styles.state}>Couldn&rsquo;t load inquiries.</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No inquiries match these filters</p>
          <p className={styles.emptyMsg}>
            They&rsquo;ll show up here as soon as a buyer reaches out.
          </p>
        </div>
      ) : (
        <ul className={cn(styles.list, isFetching && styles.busy)}>
          {items.map((inq) => {
            const open = expanded === inq.id;
            return (
              <li key={inq.id} className={cn(styles.row, open && styles.rowOpen)}>
                <button
                  type="button"
                  className={styles.rowHead}
                  onClick={() => setExpanded(open ? null : inq.id)}
                  aria-expanded={open}
                >
                  <div className={styles.rowMain}>
                    <p className={styles.rowName}>{inq.name}</p>
                    <p className={styles.rowMeta}>
                      {CHANNEL_LABEL[inq.channel] ?? inq.channel} ·{' '}
                      {new Date(inq.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      styles.statusPill,
                      styles[`status_${inq.status.replace(/-/g, '_')}`],
                    )}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === inq.status)?.label}
                  </span>
                  <span className={styles.caret} aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>

                {open ? (
                  <div className={styles.rowBody}>
                    {inq.email ? (
                      <p>
                        <span className={styles.bodyLabel}>Email</span>
                        <a href={`mailto:${inq.email}`} className={styles.link}>
                          {inq.email}
                        </a>
                      </p>
                    ) : null}
                    {inq.phone ? (
                      <p>
                        <span className={styles.bodyLabel}>Phone</span>
                        <a href={`tel:${inq.phone}`} className={styles.link}>
                          {inq.phone}
                        </a>
                      </p>
                    ) : null}
                    {inq.slots && inq.slots.length > 0 ? (
                      <p>
                        <span className={styles.bodyLabel}>Slots</span>
                        {inq.slots.join(', ')}
                      </p>
                    ) : null}
                    {inq.message ? (
                      <p className={styles.message}>
                        <span className={styles.bodyLabel}>Message</span>
                        {inq.message}
                      </p>
                    ) : null}

                    <div className={styles.actions}>
                      <label className={styles.statusSelect}>
                        <span className={styles.bodyLabel}>Update status</span>
                        <select
                          value={inq.status}
                          disabled={updateState.isLoading}
                          onChange={(e) =>
                            onChangeStatus(inq.id, e.target.value as InquiryStatus)
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
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
    </section>
  );
}

/* ─── filter pill rows ────────────────────────────────────────────────── */
interface FilterPillProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}

function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterPillProps<T>) {
  return (
    <div className={styles.filterRow}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.pills}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              className={cn(styles.pill, active && styles.pillActive)}
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
