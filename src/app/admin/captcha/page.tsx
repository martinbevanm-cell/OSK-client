import type { Metadata } from 'next';
import { CaptchaManager } from '../_components/CaptchaManager';

export const metadata: Metadata = {
  title: 'Admin · Captcha',
  robots: { index: false },
};

export default function AdminCaptchaPage() {
  return <CaptchaManager />;
}
