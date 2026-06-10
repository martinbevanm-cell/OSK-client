'use client';

import Link from 'next/link';
import { useListInquiriesQuery } from '@/features/inquiries';
import { useListMyPropertiesQuery } from '@/features/properties';
import { useListNotificationsQuery } from '@/features/notifications';
import { selectCurrentUser } from '@/features/auth';
import { useAppSelector } from '@/store/hooks';
import { Badge } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import styles from './DashboardOverview.module.scss';

const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  call: 'Call',
  whatsapp: 'WhatsApp',
  chat: 'Chat',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  'callback-requested': 'Callback',
  closed: 'Closed',
};

export function DashboardOverview() {
  const user = useAppSelector(selectCurrentUser);
  const inquiriesQuery = useListInquiriesQuery({ page: 1, limit: 5 });
  const listingsQuery = useListMyPropertiesQuery({ page: 1, limit: 5 });
  const notificationsQuery = useListNotificationsQuery({ page: 1, limit: 1 });

  const inquiryCount = inquiriesQuery.data?.meta.total ?? 0;
  const listingsCount = listingsQuery.data?.meta.total ?? 0;
  const unread = notificationsQuery.data?.unread ?? 0;
  const respondedRate = '—'; // wire to a real metric later

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Welcome back</span>
        <h1 className={styles.title}>
          {user ? `Hi, ${user.name.split(' ')[0]}.` : 'Hello there.'}
        </h1>
        <p className={styles.sub}>
          Here&rsquo;s a quick snapshot of your listings and recent activity.
        </p>
      </header>

      <dl className={styles.stats} aria-label="At a glance">
        <Stat
          label="My listings"
          value={String(listingsCount)}
          href="/dashboard/listings"
        />
        <Stat
          label="Inquiries"
          value={String(inquiryCount)}
          href="/dashboard/inquiries"
        />
        <Stat label="Unread alerts" value={String(unread)} />
        <Stat label="Reply rate" value={respondedRate} />
      </dl>

      <div className={styles.grid}>
        {/* Recent inquiries */}
        <section className={styles.card} aria-labelledby="inq-heading">
          <header className={styles.cardHead}>
            <span className={styles.cardEyebrow}>Latest leads</span>
            <h2 id="inq-heading" className={styles.cardTitle}>
              Recent inquiries
            </h2>
            <Link href="/dashboard/inquiries" className={styles.cardLink}>
              View all →
            </Link>
          </header>

          {inquiriesQuery.isLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : inquiriesQuery.isError ? (
            <p className={styles.muted}>Couldn&rsquo;t load inquiries.</p>
          ) : !inquiriesQuery.data || inquiriesQuery.data.items.length === 0 ? (
            <p className={styles.muted}>
              No inquiries yet — they&rsquo;ll appear here once buyers reach out.
            </p>
          ) : (
            <ul className={styles.list}>
              {inquiriesQuery.data.items.map((inq) => (
                <li key={inq.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <p className={styles.rowTitle}>{inq.name}</p>
                    <p className={styles.rowMeta}>
                      {CHANNEL_LABEL[inq.channel] ?? inq.channel} ·{' '}
                      {new Date(inq.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge tone={inq.status === 'new' ? 'new' : 'resale'}>
                    {STATUS_LABEL[inq.status] ?? inq.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent listings */}
        <section className={styles.card} aria-labelledby="lst-heading">
          <header className={styles.cardHead}>
            <span className={styles.cardEyebrow}>Your inventory</span>
            <h2 id="lst-heading" className={styles.cardTitle}>
              Recent listings
            </h2>
            <Link href="/dashboard/listings" className={styles.cardLink}>
              Manage all →
            </Link>
          </header>

          {listingsQuery.isLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : listingsQuery.isError ? (
            <p className={styles.muted}>Couldn&rsquo;t load listings.</p>
          ) : !listingsQuery.data || listingsQuery.data.items.length === 0 ? (
            <p className={styles.muted}>
              No listings yet —{' '}
              <Link href="/sell" className={styles.inlineLink}>
                start your first listing
              </Link>
              .
            </p>
          ) : (
            <ul className={styles.list}>
              {listingsQuery.data.items.map((p) => (
                <li key={p.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <p className={styles.rowTitle}>{p.title}</p>
                    <p className={styles.rowMeta}>
                      {p.locality}, {p.city}
                    </p>
                  </div>
                  <p className={styles.price}>{formatPrice(p.price, p.currency)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue}>{value}</dd>
    </>
  );
  return href ? (
    <Link href={href} className={styles.stat}>
      {body}
    </Link>
  ) : (
    <div className={styles.stat}>{body}</div>
  );
}
