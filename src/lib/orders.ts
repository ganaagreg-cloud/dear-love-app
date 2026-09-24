import 'server-only';
import { store, type OrderRow, type OrderStatus } from './store';
import { createCheckout, isDead, isSucceeded, mockPaymentsAllowed, retrieveIntent, wireConfigured } from './wire';
import { SITE_URL } from './env';
import { getTemplate } from '@/templates/registry';

export type { OrderRow };
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

/** Creates (or re-uses an unpaid) page + a fresh order, and returns where to pay. */
export async function createOrder(userId: string, input: { templateId?: string; pageId?: string }) {
  const db = store();
  let pageId = input.pageId, templateId = input.templateId;

  if (pageId) {
    const page = await db.getPage(pageId);
    if (!page || page.user_id !== userId) throw new HttpError(404, 'Хуудас олдсонгүй');
    if (page.paid_at) throw new HttpError(409, 'Энэ хуудас аль хэдийн төлөгдсөн');
    templateId = page.template_id;
  }
  const meta = templateId ? getTemplate(templateId) : undefined;
  if (!meta) throw new HttpError(400, 'Загвар олдсонгүй');

  const provider = wireConfigured() ? 'wire' : 'mock';
  if (provider === 'mock' && !mockPaymentsAllowed()) throw new HttpError(503, 'Төлбөрийн систем тохируулагдаагүй байна');

  if (!pageId) pageId = (await db.createPage(userId, meta.id, meta.name)).id;
  const order = await db.createOrder({ user_id: userId, page_id: pageId, template_id: meta.id, amount: meta.price, provider });

  let checkoutUrl: string;
  if (provider === 'wire') {
    const r = await createCheckout({
      orderId: order.id, amountMnt: meta.price, description: `Dear Love · ${meta.name}`,
      successUrl: `${SITE_URL}/pay/${order.id}`, cancelUrl: `${SITE_URL}/pay/${order.id}?canceled=1`,
    });
    checkoutUrl = r.checkoutUrl;
    await db.updateOrder(order.id, { wire_payment_intent_id: r.paymentIntentId, checkout_url: checkoutUrl });
  } else {
    checkoutUrl = `/pay/mock/${order.id}`;
    await db.updateOrder(order.id, { checkout_url: checkoutUrl });
  }
  return { orderId: order.id, pageId, checkoutUrl };
}

/** Idempotent fulfilment: marks the order paid and unlocks editing on its page. */
export async function markOrderPaid(orderId: string) {
  const db = store();
  const at = new Date().toISOString();
  await db.updateOrder(orderId, { status: 'paid', paid_at: at }, 'pending');
  const order = await db.getOrder(orderId);
  if (order?.status === 'paid') await db.markPagePaid(order.page_id, at);
}

export async function markOrderDead(orderId: string, status: Exclude<OrderStatus, 'pending' | 'paid'>) {
  await store().updateOrder(orderId, { status }, 'pending');
}

/** Pulls the latest state from Wire (used by the /pay poller — works even before webhooks are set up). */
export async function syncOrder(order: OrderRow): Promise<OrderStatus> {
  if (order.status !== 'pending' || order.provider !== 'wire' || !order.wire_payment_intent_id) return order.status;
  const pi = await retrieveIntent(order.wire_payment_intent_id);
  if (isSucceeded(pi) && pi.amount === order.amount * 100) { await markOrderPaid(order.id); return 'paid'; }
  if (isDead(pi)) { const s = pi.status === 'canceled' ? 'canceled' : 'failed'; await markOrderDead(order.id, s); return s; }
  return 'pending';
}
