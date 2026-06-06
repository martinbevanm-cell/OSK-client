import type { ReactNode } from 'react';
import { RequireAuth } from '@/features/auth';
import { AdminShell } from './_components/AdminShell';

/** Every /admin route requires an authenticated user with the admin role. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={['admin']}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
