import type { Metadata } from 'next';
import { MyListings } from '../_components/MyListings';

export const metadata: Metadata = {
  title: 'My Listings',
  robots: { index: false },
};

export default function DashboardListingsPage() {
  return <MyListings />;
}
