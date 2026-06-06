import type { Metadata } from 'next';
import { AdminOverview } from './_components/AdminOverview';

export const metadata: Metadata = {
  title: 'Admin · Overview',
  robots: { index: false },
};

export default function AdminPage() {
  return <AdminOverview />;
}
