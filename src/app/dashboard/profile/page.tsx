import type { Metadata } from 'next';
import { ChangePasswordForm } from '../_components/ChangePasswordForm';
import { ProfileEditor } from '../_components/ProfileEditor';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false },
};

export default function DashboardProfilePage() {
  return (
    <>
      <ProfileEditor />
      <ChangePasswordForm />
    </>
  );
}
