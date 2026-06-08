import type { Metadata } from 'next';
import { EmailManager } from '../_components/EmailManager';

export const metadata: Metadata = {
  title: 'Admin · Email',
  robots: { index: false },
};

export default function AdminEmailPage() {
  return <EmailManager />;
}
