import type { Metadata } from 'next';
import { SubscribersManager } from '../_components/SubscribersManager';

export const metadata: Metadata = {
  title: 'Admin · Subscribers',
  robots: { index: false },
};

export default function AdminSubscribersPage() {
  return <SubscribersManager />;
}
