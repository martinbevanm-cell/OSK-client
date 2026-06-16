'use client';

import { useState } from 'react';
import type { ContactMessage, ContactMessageStatus } from '@contracts';
import {
  useListContactMessagesQuery,
  useReplyToContactMessageMutation,
  useUpdateContactMessageMutation,
} from '@/features/contact';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './ContactMessagesManager.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Admin inbox for the public /contact form.
 *
 * Workflow:
 *  1. New messages land at the top with a "NEW" badge.
 *  2. Click "Reply" → opens the user's mail client with the message
 *     body quoted; that's the fastest way to respond without
 *     dragging another tool in.
 *  3. After sending, click "Mark replied" → the badge turns green
 *     and the message drops out of the "new" filter.
 *  4. Spam or out-of-scope messages get "Close" (no email).
 *
 * Admin notes are private and visible only here.
 * ──────────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<ContactMessageStatus, string> = {
  new: styles.toneNew ?? '',
  replied: styles.toneReplied ?? '',
  closed: styles.toneClosed ?? '',
};
const STATUS_LABEL: Record<ContactMessageStatus, string> = {
  new: 'New',
  replied: 'Replied',
  closed: 'Closed',
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function ContactMessagesManager() {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<ContactMessageStatus | 'all'>('new');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useListContactMessagesQuery({
    page,
    limit: 20,
    status: status === 'all' ? undefined : status,
  });
  const [updateMessage, { isLoading: saving }] = useUpdateContactMessageMutation();
  const [sendReply] = useReplyToContactMessageMutation();
  const [notes, setNotes] = useState<Record<string, string>>({});
  /* Per-message draft state keyed by id, so typing in one card never
   * leaks into another. The empty-string fallback below means a card
   * starts with an empty textarea regardless of any other card. */
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const unread = data?.unread ?? 0;

  const setNote = (id: string, value: string) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  };

  const setReply = (id: string, value: string) => {
    setReplies((prev) => ({ ...prev, [id]: value }));
  };

  const onSendReply = async (msg: ContactMessage) => {
    const body = (replies[msg.id] ?? '').trim();
    if (!body) {
      dispatch(toastPushed('error', 'Reply is empty.'));
      return;
    }
    setSendingId(msg.id);
    try {
      await sendReply({ id: msg.id, body }).unwrap();
      dispatch(toastPushed('success', `Reply sent to ${msg.email} — marked replied.`));
      setReply(msg.id, '');
    } catch {
      /* surfaced by the global toast — most likely cause is email
       * provider isn't configured under /admin/email. */
    } finally {
      setSendingId(null);
    }
  };

  const markStatus = async (msg: ContactMessage, next: ContactMessageStatus) => {
    try {
      await updateMessage({
        id: msg.id,
        body: { status: next, adminNote: notes[msg.id] ?? msg.adminNote },
      }).unwrap();
      dispatch(toastPushed('success', `Marked as ${STATUS_LABEL[next].toLowerCase()}.`));
    } catch {
      /* surfaced by global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Contact messages</span>
        <h1 className={styles.title}>Contact inbox</h1>
        <p className={styles.sub}>
          Messages submitted through the public <code>/contact</code> form.
          {unread > 0 ? (
            <>
              {' '}
              You have <strong>{unread}</strong> new{' '}
              {unread === 1 ? 'message' : 'messages'}.
            </>
          ) : null}
        </p>
      </header>

      <div className={styles.filterBar} role="tablist">
        {(['new', 'replied', 'closed', 'all'] as const).map((key) => (
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
            {key === 'all' ? 'All' : STATUS_LABEL[key as ContactMessageStatus]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className={styles.muted}>Loading messages…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load the contact inbox.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No messages in the <strong>{status}</strong> bucket yet.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((msg) => {
            const noteValue = notes[msg.id] ?? msg.adminNote ?? '';
            const noteDirty = noteValue !== (msg.adminNote ?? '');
            return (
              <li key={msg.id} className={styles.card}>
                <header className={styles.cardHead}>
                  <div>
                    <p className={styles.cardName}>
                      {msg.name}{' '}
                      <span className={styles.cardEmail}>&lt;{msg.email}&gt;</span>
                    </p>
                    <p className={styles.cardMeta}>
                      {msg.topic} · {formatDate(msg.createdAt)}
                    </p>
                  </div>
                  <span className={cn(styles.statusPill, STATUS_TONE[msg.status])}>
                    {STATUS_LABEL[msg.status]}
                  </span>
                </header>

                <p className={styles.cardBody}>{msg.message}</p>

                {/* Inline reply — typed directly here. On send the
                    backend emails the visitor through the configured
                    provider, marks the message replied, and notifies
                    this admin that delivery succeeded.
                    Only shown while the message is still in `new`
                    status. Once replied, the conversation is done
                    from OSK's side — the admin can follow up via
                    their inbox if needed (the visitor's reply lands
                    back at the support address). */}
                {msg.status === 'new' ? (
                  <label className={styles.noteField}>
                    <span className={styles.noteLabel}>Reply to {msg.name}</span>
                    <textarea
                      className={styles.note}
                      rows={4}
                      placeholder={`Hi ${msg.name.split(' ')[0] ?? msg.name}, thanks for reaching out…`}
                      value={replies[msg.id] ?? ''}
                      onChange={(e) => setReply(msg.id, e.target.value)}
                      disabled={sendingId === msg.id}
                    />
                  </label>
                ) : null}

                <label className={styles.noteField}>
                  <span className={styles.noteLabel}>Internal notes (private)</span>
                  <textarea
                    className={styles.note}
                    rows={2}
                    placeholder="Reminders, tags, anything for your team."
                    value={noteValue}
                    onChange={(e) => setNote(msg.id, e.target.value)}
                  />
                </label>

                <div className={styles.cardActions}>
                  {msg.status === 'new' ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={sendingId === msg.id || !(replies[msg.id] ?? '').trim()}
                      onClick={() => onSendReply(msg)}
                    >
                      {sendingId === msg.id ? 'Sending…' : 'Send reply'}
                    </Button>
                  ) : null}
                  {msg.status !== 'closed' ? (
                    <button
                      type="button"
                      className={styles.closeBtn}
                      disabled={saving}
                      onClick={() => markStatus(msg, 'closed')}
                    >
                      Close
                    </button>
                  ) : null}
                  {noteDirty ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                      onClick={() =>
                        markStatus(msg, msg.status === 'closed' ? 'closed' : msg.status)
                      }
                    >
                      Save note
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
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
