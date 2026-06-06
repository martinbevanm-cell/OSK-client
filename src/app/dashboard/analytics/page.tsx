import type { Metadata } from 'next';
import { SellerAnalytics } from '../_components/SellerAnalytics';

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false },
};

export default function DashboardAnalyticsPage() {
  return <SellerAnalytics />;
}
