'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeaderAuth } from '@/features/auth';
import { SavedHeaderLink } from '@/features/saved';
import { NotificationsBell } from '@/features/notifications';
import { useGetSiteSettingsQuery } from '@/features/settings';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { cn } from '@/lib/cn';
import styles from './Header.module.scss';

const NAV_LINKS = [
  { href: '/buy', label: 'Buy' },
  { href: '/rent', label: 'Rent' },
  { href: '/new-projects', label: 'New Projects' },
  { href: '/commercial', label: 'Commercial' },
  { href: '/plots', label: 'Plots & Land' },
];

/**
 * Primary CTA in the header — replaces the old "Sell" nav link with an
 * action-focused button. Unauthenticated users hit the auth wall on the
 * new-listing route and are redirected to sign-in with a return URL.
 */
const ADD_PROPERTY_HREF = '/dashboard/listings/new';

/**
 * Site header. Client component because the mobile drawer needs open/close
 * state, route-aware active link styling, and ESC / route-change auto-close.
 */
export function Header() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const { data: settings } = useGetSiteSettingsQuery();
  const companyName = settings?.companyName ?? 'OSK';
  const logoUrl = settings?.logoUrl ?? '';

  /* Close the drawer whenever the user navigates. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* ESC closes the drawer. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={cn(styles.header, open && styles.headerOpen)}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${companyName} home`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(logoUrl)}
              alt={companyName}
              className={styles.brandLogo}
            />
          ) : (
            <>
              <span className={styles.brandName}>{companyName}</span>
              <span className={styles.brandRule} aria-hidden="true" />
              <span className={styles.brandSub}>Real Estate</span>
            </>
          )}
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(styles.link, active && styles.linkActive)}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <Link href={ADD_PROPERTY_HREF} className={styles.cta}>
            <PlusIcon />
            <span>Add property</span>
          </Link>
          <span className={styles.sep} aria-hidden="true" />
          <NotificationsBell />
          <SavedHeaderLink />
          <HeaderAuth />
        </div>

        <button
          type="button"
          className={cn(styles.ham, open && styles.hamOpen)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="primary-mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        id="primary-mobile-nav"
        className={cn(styles.drawer, open && styles.drawerOpen)}
        aria-hidden={!open}
      >
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(styles.drawerLink, active && styles.drawerLinkActive)}
              aria-current={active ? 'page' : undefined}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href={ADD_PROPERTY_HREF}
          className={styles.drawerCta}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        >
          <PlusIcon />
          <span>Add property</span>
        </Link>
        {/* Drawer footer — saved-listings shortcut + account menu. The
         * HeaderAuth dropdown becomes a viewport-anchored bottom sheet
         * on narrow viewports so it can't escape off-edge. Dashboard /
         * Profile / Saved / Admin links live inside that menu — we don't
         * repeat them as drawer entries. */}
        <div className={styles.drawerActions}>
          <SavedHeaderLink variant="inline" />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
