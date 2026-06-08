import type { Metadata } from 'next';
import { SubscriptionPanel } from '../_components/SubscriptionPanel';

export const metadata: Metadata = {
  title: 'My subscription',
  robots: { index: false },
};

export default function DashboardSubscriptionPage() {
  return <SubscriptionPanel />;
}
