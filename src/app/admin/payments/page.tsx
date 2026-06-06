import type { Metadata } from 'next';
import { PaymentsAdmin } from '../_components/PaymentsAdmin';

export const metadata: Metadata = {
  title: 'Admin · Payments',
  robots: { index: false },
};

export default function AdminPaymentsPage() {
  return <PaymentsAdmin />;
}
