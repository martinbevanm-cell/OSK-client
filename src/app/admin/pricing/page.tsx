import type { Metadata } from 'next';
import { PricingManager } from '../_components/PricingManager';

export const metadata: Metadata = {
  title: 'Admin · Pricing',
  robots: { index: false },
};

export default function AdminPricingPage() {
  return <PricingManager />;
}
