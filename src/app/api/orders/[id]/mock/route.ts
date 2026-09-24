import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { store } from '@/lib/store';
import { markOrderDead, markOrderPaid } from '@/lib/orders';
import { mockPaymentsAllowed } from '@/lib/wire';

/** DEV/DEMO ONLY — simulates the payment provider. Disabled in production unless ALLOW_MOCK_PAYMENTS=1 / DEMO_MODE=1. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mockPaymentsAllowed()) return NextResponse.json({ error: 'Туршилтын төлбөр хаалттай' }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const { id } = await params;
  const order = await store().getOrder(id);
  if (!order || order.user_id !== user.id || order.provider !== 'mock') return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 });
  const { outcome } = await req.json().catch(() => ({ outcome: 'paid' }));
  if (outcome === 'cancel') await markOrderDead(id, 'canceled'); else await markOrderPaid(id);
  return NextResponse.json({ ok: true });
}
