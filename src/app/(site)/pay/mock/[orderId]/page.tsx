import { notFound } from 'next/navigation';
import { mockPaymentsAllowed } from '@/lib/wire';
import MockCheckout from './MockCheckout';

export const metadata = { title: 'Туршилтын төлбөр' };

export default async function Mock({ params }: { params: Promise<{ orderId: string }> }) {
  if (!mockPaymentsAllowed()) notFound();
  return <div className="page-narrow"><MockCheckout orderId={(await params).orderId} /></div>;
}
