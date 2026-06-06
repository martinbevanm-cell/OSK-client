import type { Metadata } from 'next';
import { AuditLog } from '../_components/AuditLog';

export const metadata: Metadata = {
  title: 'Admin · Audit log',
  robots: { index: false },
};

export default function AdminAuditPage() {
  return <AuditLog />;
}
