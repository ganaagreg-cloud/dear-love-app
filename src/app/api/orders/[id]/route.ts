import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { store } from '@/lib/store';
import { syncOrder } from '@/lib/orders';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const { id } = await params;
  const order = await store().getOrder(id);
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 });
  let status = order.status;
  try { status = await syncOrder(order); } catch (e) { console.error('[orders] sync failed', e); }
  return NextResponse.json({ status, pageId: order.page_id, checkoutUrl: order.checkout_url, amount: order.amount, templateId: order.template_id });
}
