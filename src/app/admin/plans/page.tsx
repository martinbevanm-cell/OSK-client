import type { Metadata } from 'next';
import { PlansManager } from '../_components/PlansManager';

export const metadata: Metadata = {
  title: 'Admin · Plans',
  robots: { index: false },
};

export default function AdminPlansPage() {
  return <PlansManager />;
}
