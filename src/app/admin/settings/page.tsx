import type { Metadata } from 'next';
import { SettingsManager } from '../_components/SettingsManager';

export const metadata: Metadata = {
  title: 'Admin · Settings',
  robots: { index: false },
};

export default function AdminSettingsPage() {
  return <SettingsManager />;
}
