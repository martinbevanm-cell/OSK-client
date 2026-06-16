import type { Metadata } from 'next';
import { GoogleAuthManager } from '../_components/GoogleAuthManager';

export const metadata: Metadata = {
  title: 'Admin · Google sign-in',
  robots: { index: false },
};

export default function AdminGoogleAuthPage() {
  return <GoogleAuthManager />;
}
