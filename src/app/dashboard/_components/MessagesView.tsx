'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Message, Thread } from '@contracts';
import { selectCurrentUser } from '@/features/auth';
import {
  messagesApi,
  useListMessagesQuery,
  useListThreadsQuery,
  useSendMessageMutation,
} from '@/features/messages';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { connectSocket } from '@/realtime/socket';
import { MediaUploader, type UploadedMedia } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { cn } from '@/lib/cn';
import styles from './MessagesView.module.scss';

/* The dashboard messages page — list of threads on the left, the active
 * thread's transcript + composer on the right. Socket.IO drives instant
 * updates; the polling intervals below are a safety net for clients that
 * temporarily lose the socket. */

const POLL_THREADS_MS = 60_000;
const POLL_MESSAGES_MS = 30_000;

export function MessagesView() {
  const user = useAppSelector(selectCurrentUser);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get('thread');

  const {
    data: threads,
    isLoading: threadsLoading,
    isError: threadsError,
  } = useListThreadsQuery(undefined, {
    pollingInterval: POLL_THREADS_MS,
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  /* Pick a default thread when none is selected — URL wins, then most-recent. */
  useEffect(() => {
    if (activeId) return;
    if (urlThreadId) {
      setActiveId(urlThreadId);
    } else if (threads && threads.length > 0) {
      setActiveId(threads[0]!.id);
    }
  }, [activeId, urlThreadId, threads]);

  const activeThread = activeId ? threads?.find((t) => t.id === activeId) : undefined;

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Conversations</span>
        <h1 className={styles.title}>Messages</h1>
        <p className={styles.sub}>
          Chat threads with buyers and sellers about specific listings.
        </p>
      </header>

      <div className={styles.layout}>
        {/* ── thread list ─────────────────────────────────────────── */}
        <aside className={styles.threads} aria-label="Conversations">
          {threadsLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : threadsError ? (
            <p className={styles.muted}>Couldn&rsquo;t load conversations.</p>
          ) : !threads || threads.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No conversations yet</p>
              <p className={styles.emptyMsg}>
                When buyers chat about a listing, threads show up here.
              </p>
            </div>
          ) : (
            <ul className={styles.threadList}>
              {threads.map((t) => {
                const active = t.id === activeId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={cn(styles.threadItem, active && styles.threadItemActive)}
                      onClick={() => {
                        setActiveId(t.id);
                        router.replace(`/dashboard/messages?thread=${t.id}`);
                      }}
                    >
                      <span className={styles.threadTop}>
                        <span className={styles.threadId}>
                          {t.counterpart?.name ?? 'Conversation'}
                        </span>
                        {t.unread > 0 ? (
                          <span
                            className={styles.unread}
                            aria-label={`${t.unread} unread`}
                          >
                            {t.unread}
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.threadMeta}>
                        {t.property?.title ?? `Listing ${t.propertyId.slice(-6)}`}
                      </span>
                      <span className={styles.threadMeta}>
                        Last activity{' '}
                        {new Date(t.lastMessageAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ── conversation ────────────────────────────────────────── */}
        <div className={styles.conversation}>
          {activeThread && user ? (
            <ConversationPane thread={activeThread} viewerId={user.id} />
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Pick a conversation</p>
              <p className={styles.emptyMsg}>
                Select a thread on the left to read messages and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── conversation pane ───────────────────────────────────────────────── */
function ConversationPane({ thread, viewerId }: { thread: Thread; viewerId: string }) {
  const threadId = thread.id;
  const { data: messages, isLoading } = useListMessagesQuery(threadId, {
    pollingInterval: POLL_MESSAGES_MS,
  });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<UploadedMedia[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const dispatch = useAppDispatch();

  /* Auto-scroll to the latest message when the list grows. */
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* Socket.IO: join the thread room and merge inbound messages into the
   * RTK Query cache as they arrive. Polling is the fallback. */
  useEffect(() => {
    if (!accessToken) return undefined;
    const socket = connectSocket(accessToken);
    socket.emit('thread:join', threadId);
    const onIncoming = (incoming: Message) => {
      if (incoming.threadId !== threadId) return;
      dispatch(
        messagesApi.util.updateQueryData('listMessages', threadId, (draftList) => {
          if (!draftList.some((m) => m.id === incoming.id)) {
            draftList.push(incoming);
          }
        }),
      );
    };
    socket.on('thread:message', onIncoming);
    return () => {
      socket.off('thread:message', onIncoming);
      socket.emit('thread:leave', threadId);
    };
  }, [threadId, accessToken, dispatch]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body && attachments.length === 0) return;
    try {
      await sendMessage({
        threadId,
        body: {
          body,
          attachments:
            attachments.length > 0
              ? attachments.map((a) => ({
                  url: a.url,
                  kind: a.kind,
                  mimeType: a.mimeType,
                  size: a.size,
                }))
              : undefined,
        },
      }).unwrap();
      setDraft('');
      setAttachments([]);
      setShowUploader(false);
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <>
      {/* Always-visible header so users know who they're talking to
       * and which listing the thread is about. */}
      <header className={styles.convHeader}>
        <span className={styles.convAvatar} aria-hidden="true">
          {thread.counterpart?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(thread.counterpart.avatarUrl)}
              alt=""
              className={styles.convAvatarImg}
            />
          ) : (
            (thread.counterpart?.name ?? '?')
              .split(/\s+/)
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()
          )}
        </span>
        <div className={styles.convIdentity}>
          <p className={styles.convName}>
            {thread.counterpart?.name ?? 'Conversation'}
            {thread.counterpart?.isOwner ? (
              <span className={styles.convRole}>Listing owner</span>
            ) : (
              <span className={styles.convRole}>
                {thread.counterpart?.role ?? 'Member'}
              </span>
            )}
          </p>
          <p className={styles.convMeta}>{thread.counterpart?.email ?? '—'}</p>
        </div>
        {thread.property ? (
          <Link
            href={`/property/${thread.property.slug}`}
            target="_blank"
            rel="noreferrer"
            className={styles.convProperty}
          >
            <span className={styles.convPropertyThumb}>
              <Image
                src={thread.property.thumbnail}
                alt={thread.property.title}
                fill
                sizes="44px"
                className={styles.convPropertyImg}
              />
            </span>
            <span className={styles.convPropertyCopy}>
              <span className={styles.convPropertyLabel}>About</span>
              <span className={styles.convPropertyTitle}>{thread.property.title}</span>
            </span>
          </Link>
        ) : null}
      </header>

      <div ref={transcriptRef} className={styles.transcript}>
        {isLoading ? (
          <p className={styles.muted}>Loading messages…</p>
        ) : !messages || messages.length === 0 ? (
          <p className={styles.muted}>No messages yet — say hello.</p>
        ) : (
          <ul className={styles.messages}>
            {messages.map((m) => {
              const mine = m.senderId === viewerId;
              return (
                <li
                  key={m.id}
                  className={cn(styles.message, mine ? styles.mine : styles.theirs)}
                >
                  {m.attachments && m.attachments.length > 0 ? (
                    <div className={styles.attachments}>
                      {m.attachments.map((a, idx) => (
                        <a
                          key={`${m.id}-${idx}`}
                          className={styles.attachment}
                          href={resolveMediaUrl(a.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {a.kind === 'video' ? (
                            <video
                              src={resolveMediaUrl(a.url)}
                              controls
                              playsInline
                              className={styles.attachmentMedia}
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(a.url)}
                              alt=""
                              className={styles.attachmentMedia}
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {m.body ? <p className={styles.bubble}>{m.body}</p> : null}
                  <span className={styles.timestamp}>
                    {new Date(m.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showUploader || attachments.length > 0 ? (
        <div className={styles.composerMedia}>
          {attachments.length > 0 ? (
            <ul className={styles.pendingList}>
              {attachments.map((a, i) => (
                <li key={`${a.url}-${i}`} className={styles.pendingItem}>
                  {a.kind === 'video' ? '🎬' : '🖼️'} attached
                  <button
                    type="button"
                    className={styles.pendingRemove}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {showUploader ? (
            <MediaUploader
              accept="both"
              multiple
              label="Drop photos or video, or browse"
              hint="JPG/PNG/WebP up to 12 MB · MP4/WebM up to 150 MB"
              disabled={attachments.length >= 6}
              onUploaded={(uploaded) => setAttachments((prev) => [...prev, ...uploaded])}
            />
          ) : null}
        </div>
      ) : null}

      <form className={styles.composer} onSubmit={onSubmit}>
        <button
          type="button"
          className={styles.attach}
          onClick={() => setShowUploader((v) => !v)}
          aria-label="Attach media"
          title="Attach photo or video"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.48l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <textarea
          className={styles.composerInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          maxLength={4000}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void onSubmit(e as unknown as FormEvent<HTMLFormElement>);
            }
          }}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={sending || (draft.trim().length === 0 && attachments.length === 0)}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </>
  );
}
