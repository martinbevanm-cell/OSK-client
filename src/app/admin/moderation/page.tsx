import type { Metadata } from 'next';
import { ModerationQueue } from '../_components/ModerationQueue';

export const metadata: Metadata = {
  title: 'Admin · Moderation',
  robots: { index: false },
};

export default function AdminModerationPage() {
  return <ModerationQueue />;
}
