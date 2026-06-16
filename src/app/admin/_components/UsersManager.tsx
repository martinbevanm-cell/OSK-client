'use client';

import { useState, type ChangeEvent } from 'react';
import type { User, UserRole } from '@contracts';
import { useRouter } from 'next/navigation';
import {
  useDeleteAdminUserMutation,
  useImpersonateUserMutation,
  useListAdminUsersQuery,
  useUpdateAdminUserMutation,
} from '@/features/admin';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth';
import { toastPushed } from '@/features/ui';
import { ConfirmDangerDialog } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './UsersManager.module.scss';

const ROLES: UserRole[] = ['buyer', 'seller', 'agent', 'admin'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function UsersManager() {
  const dispatch = useAppDispatch();
  const me = useAppSelector(selectCurrentUser);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useListAdminUsersQuery({
    q: q.trim() || undefined,
    page,
    limit: 20,
  });
  const router = useRouter();
  const [updateUser, { isLoading: updating }] = useUpdateAdminUserMutation();
  const [impersonate, { isLoading: impersonating }] = useImpersonateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation();
  const [busyId, setBusyId] = useState<string | null>(null);
  /* The user the admin is about to delete — null when the dialog is
   * closed. Held outside the row map so the dialog persists in the
   * DOM long enough to animate even after the row unmounts. */
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const canPrev = page > 1;
  const canNext = meta ? page < meta.pages : false;

  const patch = async (
    user: User,
    body: { role?: UserRole; status?: 'active' | 'blocked' },
  ) => {
    setBusyId(user.id);
    try {
      await updateUser({ id: user.id, body }).unwrap();
      dispatch(toastPushed('success', `Updated ${user.name}.`));
    } catch {
      /* surfaced by the global toast */
    } finally {
      setBusyId(null);
    }
  };

  const onDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      await deleteUser(target.id).unwrap();
      dispatch(
        toastPushed(
          'success',
          `${target.name} deleted. ${target.email} is available for re-registration.`,
        ),
      );
      setDeleteTarget(null);
    } catch {
      /* surfaced by the global toast — leave the dialog open so the
       * admin can retry without re-clicking the row button. */
    }
  };

  const onImpersonate = async (user: User) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Impersonate ${user.name}? You'll see the site as them. Your admin session is preserved — use the banner to switch back.`,
      )
    ) {
      return;
    }
    setBusyId(user.id);
    try {
      await impersonate(user.id).unwrap();
      dispatch(toastPushed('success', `Now impersonating ${user.name}.`));
      /* Drop them onto the dashboard so they see the target's POV. */
      router.push('/dashboard');
    } catch {
      /* surfaced by the global toast */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Users</span>
        <h1 className={styles.title}>Users</h1>
        <p className={styles.sub}>
          Change roles or block accounts. Blocked users keep their history, but
          can&rsquo;t sign in or contact owners.
        </p>
      </header>

      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <span className={styles.count}>
          {meta
            ? `${meta.total.toLocaleString('en-US')} ${
                meta.total === 1 ? 'user' : 'users'
              }`
            : '—'}
        </span>
      </div>

      {isLoading ? (
        <p className={styles.muted}>Loading users…</p>
      ) : isError ? (
        <p className={styles.muted}>Couldn&rsquo;t load the user list.</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>
          No users match {q.trim() ? `“${q.trim()}”` : 'your search'}.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((u) => {
            const isSelf = me?.id === u.id;
            const blocked = u.status === 'blocked';
            return (
              <li key={u.id} className={cn(styles.row, blocked && styles.rowBlocked)}>
                <span className={styles.avatar} aria-hidden="true">
                  {initials(u.name)}
                </span>

                <div className={styles.copy}>
                  <p className={styles.name}>
                    {u.name}
                    {isSelf ? <span className={styles.selfTag}>· you</span> : null}
                  </p>
                  <p className={styles.meta}>
                    {u.email} · joined {formatDate(u.createdAt)}
                  </p>
                </div>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Role</span>
                  <select
                    className={styles.select}
                    value={u.role}
                    disabled={updating || isSelf}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      patch(u, { role: e.target.value as UserRole })
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.impersonate}
                    disabled={impersonating || isSelf || blocked || busyId === u.id}
                    onClick={() => onImpersonate(u)}
                    title={
                      blocked
                        ? 'Cannot impersonate a blocked account'
                        : `Sign in as ${u.name}`
                    }
                  >
                    {busyId === u.id && impersonating ? 'Switching…' : 'Impersonate'}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      styles.statusBtn,
                      blocked ? styles.unblock : styles.block,
                    )}
                    disabled={updating || isSelf || busyId === u.id}
                    onClick={() => patch(u, { status: blocked ? 'active' : 'blocked' })}
                  >
                    {blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    disabled={isSelf || deleting}
                    onClick={() => setDeleteTarget(u)}
                    title={
                      isSelf
                        ? 'You can’t delete your own account from here'
                        : `Delete ${u.name}`
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleteTarget ? (
        <ConfirmDangerDialog
          title={`Delete ${deleteTarget.name}?`}
          description={`This permanently removes ${deleteTarget.name} (${deleteTarget.email}) from OSK.`}
          consequences={[
            'Permanently delete every property they own (along with the inquiries, conversations and reviews tied to each).',
            'Delete every review they wrote.',
            'Cancel any active subscription on their account.',
            'Sign them out of every device immediately.',
            `Free the email address ${deleteTarget.email} — anyone (including this person) will be able to register a new account with it.`,
          ]}
          confirmLabel="Delete user permanently"
          busy={deleting}
          onConfirm={onDeleteConfirmed}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}

      {meta && meta.pages > 1 ? (
        <nav className={styles.pager} aria-label="Pagination">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!canPrev}
            onClick={() => setPage((n) => Math.max(1, n - 1))}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.pages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!canNext}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
