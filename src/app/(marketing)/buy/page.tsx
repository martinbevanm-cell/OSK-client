import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PropertyExplorer } from '@/features/properties';

export const metadata: Metadata = {
  title: 'Homes for Sale',
  description: 'Browse homes for sale — new projects and resale.',
};

export default function BuyPage() {
  return (
    <Suspense>
      <PropertyExplorer
        type="home"
        title="Homes for Sale"
        subtitle="Villas, apartments and townhouses across new projects and resale."
      />
    </Suspense>
  );
}
