import type { Metadata } from 'next';
import { FeaturedManager } from '../_components/FeaturedManager';

export const metadata: Metadata = {
  title: 'Admin · Featured listings',
  robots: { index: false },
};

export default function AdminFeaturedPage() {
  return <FeaturedManager />;
}
