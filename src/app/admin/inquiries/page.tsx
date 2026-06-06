import type { Metadata } from 'next';
import { MyInquiries } from '@/app/dashboard/_components/MyInquiries';

export const metadata: Metadata = {
  title: 'Admin · Inquiries',
  robots: { index: false },
};

/**
 * Admin global inquiries view. Reuses the seller dashboard's MyInquiries
 * component — the backend widens scope automatically when role=admin, so
 * the same hook + UI works; only the header copy differs (adminMode).
 */
export default function AdminInquiriesPage() {
  return <MyInquiries adminMode />;
}
