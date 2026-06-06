import type { Metadata } from 'next';
import { MyInquiries } from '../_components/MyInquiries';

export const metadata: Metadata = {
  title: 'Inquiries',
  robots: { index: false },
};

export default function DashboardInquiriesPage() {
  return <MyInquiries />;
}
