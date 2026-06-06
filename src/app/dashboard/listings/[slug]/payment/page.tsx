import type { Metadata } from 'next';
import { ListingCheckout } from '../../../_components/ListingCheckout';

export const metadata: Metadata = {
  title: 'Listing checkout',
  robots: { index: false },
};

interface PageParams {
  params: Promise<{ slug: string }>;
}

export default async function ListingPaymentPage({ params }: PageParams) {
  const { slug } = await params;
  return <ListingCheckout slug={slug} />;
}
