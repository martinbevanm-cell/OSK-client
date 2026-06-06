import type { Metadata } from 'next';
import { NewListingForm } from '../../_components/NewListingForm';

export const metadata: Metadata = {
  title: 'New Listing',
  robots: { index: false },
};

export default function NewListingPage() {
  return <NewListingForm />;
}
