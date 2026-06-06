import type { Metadata } from 'next';
import { ChangePasswordForm } from '../_components/ChangePasswordForm';
import { ProfileEditor } from '../_components/ProfileEditor';
import { VerifyEmailBanner } from '../_components/VerifyEmailBanner';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false },
};

export default function DashboardProfilePage() {
  return (
    <>
      <VerifyEmailBanner />
      <ProfileEditor />
      <ChangePasswordForm />
    </>
  );
}
