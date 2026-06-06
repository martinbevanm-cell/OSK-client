import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MessagesView } from '../_components/MessagesView';

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false },
};

export default function DashboardMessagesPage() {
  return (
    <Suspense>
      <MessagesView />
    </Suspense>
  );
}
