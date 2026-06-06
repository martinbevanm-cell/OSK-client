import type { Metadata } from 'next';
import { ReviewsModeration } from '../_components/ReviewsModeration';

export const metadata: Metadata = {
  title: 'Admin · Reviews',
  robots: { index: false },
};

export default function AdminReviewsPage() {
  return <ReviewsModeration />;
}
