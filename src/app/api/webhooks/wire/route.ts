import { NextResponse } from 'next/server';
import { SIGNATURE_HEADER, Webhooks, type WireEvent } from '@buildry-wire/wire';
import { store } from '@/lib/store';
import { markOrderDead, markOrderPaid } from '@/lib/orders';
import { isSucceeded, retrieveIntent, toMinor } from '@/lib/wire';

export const runtime = 'nodejs';

/** Wire → us. Signature-verified, de-duplicated, and re-checked against the API before unlocking. */
export async function POST(req: Request) {
  const secret = process.env.WIRE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 });

  const raw = await req.text();
  let event: WireEvent;
  try {
    event = new Webhooks().verify(raw, req.headers.get(SIGNATURE_HEADER) ?? '', secret);
  } catch {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  const db = store();
  if (!(await db.recordEvent(event.id, event.type))) return NextResponse.json({ ok: true, duplicate: true });

  const obj = ((event.data as { object?: { id?: string } })?.object ?? event.data) as { id?: string };
  const piId = obj?.id;
  if (!piId || !event.type.startsWith('payment_intent.')) return NextResponse.json({ ok: true, ignored: true });

  const order = await db.getOrderByIntent(piId);
  if (!order) return NextResponse.json({ ok: true, unknown: true });

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = await retrieveIntent(piId); // never trust the payload alone
      if (isSucceeded(pi) && pi.amount === toMinor(order.amount)) await markOrderPaid(order.id);
    } else if (event.type === 'payment_intent.canceled') {
      await markOrderDead(order.id, 'canceled');
    } else if (event.type === 'payment_intent.payment_failed') {
      await markOrderDead(order.id, 'failed');
    }
  } catch (e) {
    console.error('[wire webhook] handling failed', e);
    await db.forgetEvent(event.id); // let Wire retry
    return NextResponse.json({ error: 'retry' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
