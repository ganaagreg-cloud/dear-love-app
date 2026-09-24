import PayStatus from './PayStatus';
export const metadata = { title: 'Төлбөр' };
export default async function Pay({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ canceled?: string }> }) {
  const { orderId } = await params;
  const { canceled } = await searchParams;
  return <div className="page-narrow"><PayStatus orderId={orderId} canceled={!!canceled} /></div>;
}
