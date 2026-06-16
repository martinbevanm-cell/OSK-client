import type { Metadata } from 'next';
import { ContactMessagesManager } from '../_components/ContactMessagesManager';

export const metadata: Metadata = {
  title: 'Admin · Contact messages',
  robots: { index: false },
};

export default function AdminContactMessagesPage() {
  return <ContactMessagesManager />;
}
