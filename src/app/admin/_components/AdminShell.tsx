'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth';
import { cn } from '@/lib/cn';
import styles from './AdminShell.module.scss';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: '/admin',
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
    href: '/admin/moderation',
    label: 'Moderation',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 2l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V6l9-4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
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
    href: '/admin/users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle
          cx="9"
          cy="8"
          r="3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 20c1.2-3.4 3.7-5 7-5s5.8 1.6 7 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle
          cx="17.5"
          cy="9"
          r="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M22 18c-.6-2-2-3.4-4.5-3.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/inquiries',
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
    href: '/admin/featured',
    label: 'Featured',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
  {
    href: '/admin/reviews',
    label: 'Reviews',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/plans',
    label: 'Plans',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M7 9h10M7 13h6M7 17h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/pricing',
    label: 'Payment config',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M20 12l-8 8-9-9V3h8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect
          x="2.5"
          y="6"
          width="19"
          height="13"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2.5 10h19M7 15h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/contact-messages',
    label: 'Contact inbox',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
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
    href: '/admin/subscribers',
    label: 'Subscribers',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M3 7h18M3 12h18M3 17h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle
          cx="20"
          cy="17"
          r="2.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    href: '/admin/email',
    label: 'Email',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M4 7l8 6 8-6"
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
    href: '/admin/google',
    label: 'Google sign-in',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M21 12c0-.65-.06-1.27-.17-1.86H12v3.52h5.05a4.32 4.32 0 0 1-1.87 2.83v2.35h3.02C19.93 17.17 21 14.83 21 12z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 21c2.43 0 4.47-.81 5.96-2.19l-3.02-2.35c-.84.57-1.91.9-2.94.9-2.26 0-4.18-1.53-4.86-3.58H3.94v2.25A8.99 8.99 0 0 0 12 21z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M7.14 13.78A5.42 5.42 0 0 1 6.86 12c0-.62.11-1.22.28-1.78V7.97H3.94A9 9 0 0 0 3 12c0 1.45.34 2.82.94 4.03l3.2-2.25z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 6.58c1.32 0 2.5.45 3.43 1.34l2.57-2.57A8.99 8.99 0 0 0 12 3a8.99 8.99 0 0 0-8.06 4.97l3.2 2.25C7.82 8.11 9.74 6.58 12 6.58z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  /* Captcha admin tab — commented out for now. Uncomment to re-enable.
   * Backend routes and the admin page remain intact and reachable via
   * /admin/captcha directly. */
  // {
  //   href: '/admin/captcha',
  //   label: 'Captcha',
  //   icon: (
  //     <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  //       <rect x="4" y="9" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
  //       <path d="M8 9V7a4 4 0 018 0v2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  //       <circle cx="12" cy="14" r="1.5" fill="currentColor" />
  //     </svg>
  //   ),
  // },
  {
    href: '/admin/audit',
    label: 'Audit log',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M4 4h12l4 4v12H4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M8 12h8M8 16h6M8 8h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.6.51.6.91V11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/**
 * Two-column admin shell — mirrors the dashboard's layout language but with
 * its own scope and CTA. Sidebar sticks below md; collapses to a toggle on
 * smaller viewports.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/admin';
  const user = useAppSelector(selectCurrentUser);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Admin">
        <div className={styles.sidebarHead}>
          <p className={styles.eyebrow}>Admin console</p>
          {user ? (
            <>
              <p className={styles.greeting}>
                Signed in as <strong>{user.name.split(' ')[0]}</strong>
              </p>
              <span className={styles.role}>{user.role}</span>
            </>
          ) : (
            <p className={styles.greeting}>OSK control</p>
          )}
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
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
          <Link href="/dashboard" className={styles.cta}>
            ← Back to dashboard
          </Link>
        </div>
      </aside>

      <div className={styles.main}>
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileNavOpen((o) => !o)}
          aria-expanded={mobileNavOpen}
          aria-controls="admin-mobile-nav"
        >
          {mobileNavOpen ? 'Close menu' : 'Admin menu'}
        </button>
        {mobileNavOpen ? (
          <nav
            id="admin-mobile-nav"
            className={styles.mobileNav}
            aria-label="Admin navigation"
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
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
