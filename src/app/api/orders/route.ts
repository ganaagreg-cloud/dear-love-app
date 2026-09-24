import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createOrder, HttpError } from '@/lib/orders';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const r = await createOrder(user.id, {
      templateId: typeof body.templateId === 'string' ? body.templateId : undefined,
      pageId: typeof body.pageId === 'string' ? body.pageId : undefined,
    });
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[orders] create failed', e);
    return NextResponse.json({ error: 'Төлбөрийн систем түр ажиллахгүй байна. Дахин оролдоно уу.' }, { status: 502 });
  }
}
