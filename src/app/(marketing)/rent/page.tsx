import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PropertyExplorer } from '@/features/properties';

export const metadata: Metadata = {
  title: 'Homes for Rent',
  description: 'Short and long-term rental homes from verified owners and agents.',
};

export default function RentPage() {
  return (
    <Suspense>
      <PropertyExplorer
        type="rental"
        title="Homes for Rent"
        subtitle="Short and long-term rentals from verified owners and agents."
      />
    </Suspense>
  );
}
