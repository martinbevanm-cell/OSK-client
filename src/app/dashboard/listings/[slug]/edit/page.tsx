import type { Metadata } from 'next';
import { EditListing } from '../../../_components/EditListing';

export const metadata: Metadata = {
  title: 'Edit Listing',
  robots: { index: false },
};

interface PageParams {
  params: Promise<{ slug: string }>;
}

export default async function EditListingPage({ params }: PageParams) {
  const { slug } = await params;
  return <EditListing slug={slug} />;
}
