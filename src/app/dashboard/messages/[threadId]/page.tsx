import { redirect } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────────
 * `/dashboard/messages/<threadId>` — entry point for deep links from
 * notifications (and any other external surface that knows a thread
 * id). Forwards to `/dashboard/messages?thread=<id>` because the
 * MessagesView client component already reads the active thread from
 * that search param. A path-segment URL reads better in the inbox /
 * push payload than a query-string one, and the redirect is free.
 * ──────────────────────────────────────────────────────────────── */
interface Props {
  params: Promise<{ threadId: string }>;
}

export default async function ThreadDeepLinkPage({ params }: Props) {
  const { threadId } = await params;
  redirect(`/dashboard/messages?thread=${encodeURIComponent(threadId)}`);
}
