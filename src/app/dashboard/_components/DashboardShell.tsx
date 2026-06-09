'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { VerifyEmailBanner } from './VerifyEmailBanner';
import { selectCurrentUser } from '@/features/auth';
import { cn } from '@/lib/cn';
import styles from './DashboardShell.module.scss';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M3 12l9-8 9 8M5 10v10h14V10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/listings',
    label: 'My listings',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect
          x="3"
          y="4"
          width="18"
          height="6"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="3"
          y="14"
          width="18"
          height="6"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/inquiries',
    label: 'Inquiries',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M4 4h16v12H7l-3 4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M4 20V10M10 20V4M16 20v-8M22 20H2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard/subscription',
    label: 'Subscription',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M3 7h18M3 12h18M3 17h18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="6" cy="7" r="1.4" fill="currentColor" />
        <circle cx="6" cy="12" r="1.4" fill="currentColor" />
        <circle cx="6" cy="17" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

/**
 * Two-column dashboard shell: sidebar nav on the left, scrolling content
 * on the right. Sidebar collapses into a horizontal scroll strip below md.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/dashboard';
  const user = useAppSelector(selectCurrentUser);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Dashboard">
        <div className={styles.sidebarHead}>
          <p className={styles.eyebrow}>Dashboard</p>
          {user ? (
            <>
              <p className={styles.greeting}>
                Hello, <strong>{user.name.split(' ')[0]}</strong>
              </p>
              <span className={styles.role}>{user.role}</span>
            </>
          ) : (
            <p className={styles.greeting}>Welcome back</p>
          )}
        </div>

        <nav className={styles.nav} aria-label="Dashboard navigation">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.navLink, active && styles.navLinkActive)}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/dashboard/listings/new" className={styles.cta}>
            + New listing
          </Link>
        </div>
      </aside>

      <div className={styles.main}>
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileNavOpen((o) => !o)}
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-mobile-nav"
        >
          {mobileNavOpen ? 'Close menu' : 'Dashboard menu'}
        </button>
        {mobileNavOpen ? (
          <nav
            id="dashboard-mobile-nav"
            className={styles.mobileNav}
            aria-label="Dashboard navigation"
          >
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(styles.navLink, active && styles.navLinkActive)}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className={styles.navIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
        <div className={styles.content}>
          <VerifyEmailBanner />
          {children}
        </div>
      </div>
    </div>
  );
}
