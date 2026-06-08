import type { Metadata } from 'next';
import { BankTransferPay } from '../../../_components/BankTransferPay';

export const metadata: Metadata = {
  title: 'Complete your bank transfer',
  robots: { index: false },
};

interface PageParams {
  params: Promise<{ paymentId: string }>;
}

export default async function BankTransferPayPage({ params }: PageParams) {
  const { paymentId } = await params;
  return <BankTransferPay paymentId={paymentId} />;
}
