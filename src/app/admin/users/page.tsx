import type { Metadata } from 'next';
import { UsersManager } from '../_components/UsersManager';

export const metadata: Metadata = {
  title: 'Admin · Users',
  robots: { index: false },
};

export default function AdminUsersPage() {
  return <UsersManager />;
}
