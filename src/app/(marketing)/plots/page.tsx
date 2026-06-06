import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PropertyExplorer } from '@/features/properties';

export const metadata: Metadata = {
  title: 'Plots & Land',
  description: 'Residential and investment plots in prime, growing locations.',
};

export default function PlotsPage() {
  return (
    <Suspense>
      <PropertyExplorer
        type="plot"
        title="Plots & Land"
        subtitle="Residential and investment plots in prime, growing locations."
      />
    </Suspense>
  );
}
