import type { ReactNode } from 'react';
import { RequireAuth } from '@/features/auth';
import { DashboardShell } from './_components/DashboardShell';

/** Every /dashboard route requires an authenticated user. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
