'use client';

import Link from 'next/link';
import { useGetAdminOverviewQuery } from '@/features/admin';
import styles from './AdminOverview.module.scss';

interface StatCard {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function AdminOverview() {
  const { data, isLoading, isError } = useGetAdminOverviewQuery();

  const cards: StatCard[] = data
    ? [
        {
          label: 'Pending review',
          value: data.properties.pending,
          hint: 'Listings waiting on moderation',
          href: '/admin/moderation',
        },
        {
          label: 'Published listings',
          value: data.properties.published,
          hint: 'Live inventory on the site',
        },
        {
          label: 'Total properties',
          value: data.properties.total,
          hint: 'All drafts, pending, published, sold',
        },
        {
          label: 'Users',
          value: data.users.total,
          hint: `${fmt(data.users.agents)} agents · ${fmt(data.users.blocked)} blocked`,
          href: '/admin/users',
        },
        {
          label: 'Inquiries',
          value: data.inquiries.total,
          hint: 'Leads across email + callback channels',
        },
        {
          label: 'Reviews',
          value: data.reviews.total,
          hint: 'Open the queue to remove abuse',
          href: '/admin/reviews',
        },
      ]
    : [];

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin</span>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.sub}>
          Live counts across the platform. Use the sidebar to drill into
          moderation, users and reviews.
        </p>
      </header>

      {isLoading ? (
        <p className={styles.muted}>Loading metrics…</p>
      ) : isError || !data ? (
        <p className={styles.muted}>Couldn&rsquo;t load admin metrics.</p>
      ) : (
        <div className={styles.grid}>
          {cards.map((card) => {
            const body = (
              <>
                <p className={styles.cardLabel}>{card.label}</p>
                <p className={styles.cardValue}>{fmt(card.value)}</p>
                {card.hint ? (
                  <p className={styles.cardHint}>{card.hint}</p>
                ) : null}
              </>
            );
            return card.href ? (
              <Link
                key={card.label}
                href={card.href}
                className={styles.cardLink}
              >
                {body}
                <span className={styles.cardArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            ) : (
              <div key={card.label} className={styles.card}>
                {body}
              </div>
            );
          })}
        </div>
      )}

      <aside className={styles.tipsCard}>
        <h2 className={styles.tipsTitle}>Triage tips</h2>
        <ul className={styles.tipsList}>
          <li>
            Aim to clear the moderation queue daily — sellers see a
            &ldquo;pending&rdquo; banner on every draft they submit.
          </li>
          <li>
            Block, don&rsquo;t delete — blocked users keep their inquiry
            history so audits stay intact.
          </li>
          <li>
            Reviews are pre-approved; remove only spam, harassment, or
            content that names a private individual.
          </li>
        </ul>
      </aside>
    </section>
  );
}
