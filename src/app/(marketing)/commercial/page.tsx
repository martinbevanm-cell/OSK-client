import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PropertyExplorer } from '@/features/properties';

export const metadata: Metadata = {
  title: 'Commercial Property',
  description: 'Offices, retail units and warehouses for sale and lease.',
};

export default function CommercialPage() {
  return (
    <Suspense>
      <PropertyExplorer
        type="commercial"
        title="Commercial Property"
        subtitle="Offices, retail units and warehouses for sale and lease."
      />
    </Suspense>
  );
}
