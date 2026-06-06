import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PropertyExplorer } from '@/features/properties';

export const metadata: Metadata = {
  title: 'New Projects',
  description:
    'Newly built homes, lofts and developments across U.S. markets — fresh construction, first to market.',
};

export default function NewProjectsPage() {
  return (
    <Suspense>
      <PropertyExplorer
        title="New Projects"
        subtitle="Newly built homes, lofts and developments across the U.S. — fresh construction, first to market."
        eyebrow="New construction"
        lockedListingKind="new-project"
      />
    </Suspense>
  );
}
