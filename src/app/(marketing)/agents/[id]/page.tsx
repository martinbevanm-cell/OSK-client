import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { AgentPublic } from '@contracts';
import { Button } from '@/components/ui';
import { AgentListings } from '@/features/agents';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { serverFetch } from '@/lib/serverApi';
import marketing from '../../_marketing.module.scss';
import styles from './page.module.scss';

export const revalidate = 120;

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const agent = await serverFetch<AgentPublic>(`/agents/${id}`);
  if (!agent) return { title: 'Agent not found' };
  return {
    title: `${agent.name} · OSK Agent`,
    description: `Browse verified listings from ${agent.name}, an OSK real-estate agent.`,
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default async function AgentDetailPage({ params }: PageParams) {
  const { id } = await params;
  const agent = await serverFetch<AgentPublic>(`/agents/${id}`);
  if (!agent) notFound();

  const joined = new Date(agent.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className={marketing.page}>
      <div className={marketing.bg} aria-hidden="true">
        <div className={marketing.bloomA} />
        <div className={marketing.bloomB} />
      </div>

      {/* breadcrumbs */}
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/" className={styles.crumb}>
          Home
        </Link>
        <span className={styles.crumbSep} aria-hidden="true">
          ›
        </span>
        <Link href="/agents" className={styles.crumb}>
          Agents
        </Link>
        <span className={styles.crumbSep} aria-hidden="true">
          ›
        </span>
        <span className={styles.crumbActive}>{agent.name}</span>
      </nav>

      {/* hero card */}
      <header className={styles.hero}>
        <span className={styles.avatar} aria-hidden="true">
          {agent.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(agent.avatarUrl)}
              alt=""
              className={styles.avatarImg}
            />
          ) : (
            initials(agent.name)
          )}
        </span>

        <div className={styles.heroCopy}>
          <p className={marketing.eyebrow}>
            <span className={marketing.eyebrowDot} aria-hidden="true" />
            OSK Verified agent
          </p>
          <h1 className={styles.name}>{agent.name}</h1>
          <p className={styles.meta}>Member since {joined}</p>
          <p className={styles.bio}>
            {agent.name.split(' ')[0]} is a verified OSK agent — every profile is identity
            and licence checked before going live. Browse their current inventory or reach
            out about a specific listing below.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/contact">
            <Button size="lg">Contact OSK about {agent.name.split(' ')[0]}</Button>
          </Link>
          <Link href="/agents" className={styles.heroGhost}>
            ← Back to directory
          </Link>
        </div>
      </header>

      <div className={marketing.body}>
        <section className={marketing.section}>
          <span className={marketing.sectionEyebrow}>Current inventory</span>
          <h2 className={marketing.sectionTitle}>
            Listings from {agent.name.split(' ')[0]}
          </h2>
          <AgentListings agentId={agent.id} />
        </section>

        <section className={marketing.section}>
          <span className={marketing.sectionEyebrow}>How OSK protects you</span>
          <h2 className={marketing.sectionTitle}>Verified profile, private contact</h2>
          <div className={marketing.cards}>
            <div className={marketing.card}>
              <span className={marketing.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M12 1l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className={marketing.cardTitle}>Identity checked</h3>
              <p className={marketing.cardCopy}>
                Every agent passes identity and licence verification before their listings
                appear in OSK search.
              </p>
            </div>
            <div className={marketing.card}>
              <span className={marketing.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className={marketing.cardTitle}>Contact stays private</h3>
              <p className={marketing.cardCopy}>
                Reach out by chat, call, WhatsApp or email — your details are shared only
                with this agent, never published, never sold.
              </p>
            </div>
            <div className={marketing.card}>
              <span className={marketing.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M20 7L9 18l-5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className={marketing.cardTitle}>OSK-backed</h3>
              <p className={marketing.cardCopy}>
                Every inquiry is logged and auditable — if something feels off, OSK can
                step in and help resolve it.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
