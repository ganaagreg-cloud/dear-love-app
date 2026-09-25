import 'server-only';
import { Wire, type PaymentIntent } from '@buildry-wire/wire';

/** Wire (api.wire.mn) — unified MN payment gateway; QPay is one of its operators. */
export const wireConfigured = () => !!process.env.WIRE_API_KEY;
export const mockPaymentsAllowed = () =>
  !wireConfigured()
    ? process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_PAYMENTS === '1' || process.env.DEMO_MODE === '1'
    : process.env.ALLOW_MOCK_PAYMENTS === '1';

let client: Wire | null = null;
export function wire() {
  if (!process.env.WIRE_API_KEY) throw new Error('WIRE_API_KEY is not set');
  client ??= new Wire(process.env.WIRE_API_KEY, { timeoutMs: 15000, maxRetries: 2 });
  return client;
}

const operators = () =>
  (process.env.WIRE_ALLOWED_OPERATORS || 'sandbox').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * TEMPORARY WORKAROUND (2026-09-25): Wire's docs say MNT amounts are minor units (x100) —
 * confirmed via their own API (PaymentIntent.amount echoed back as documented) — but a real
 * live QPay checkout charged the raw un-divided number (sent 10000 minor units for a 100₮
 * price, QPay invoice + bank app showed 10,000₮, a 100x overcharge). Their PaymentIntent layer
 * and QPay connector disagree on the convention. Reported to Wire support.
 * Until they confirm a fix, send whole ₮ directly (no x100) so real charges match our prices.
 * REVERT to `Math.round(mnt) * 100` once Wire confirms this is fixed — check with a small live
 * test again first, since flipping this back too early silently 100x-UNDERcharges instead.
 */
export const toMinor = (mnt: number) => Math.round(mnt);

export async function createCheckout(opts: {
  orderId: string; amountMnt: number; description: string; successUrl: string; cancelUrl: string;
}) {
  const w = wire();
  const pi = await w.paymentIntents.create({
    amount: toMinor(opts.amountMnt),
    currency: 'MNT',
    allowed_operators: operators(),
    metadata: { order_id: opts.orderId, description: opts.description.slice(0, 200) },
    idempotencyKey: `pi-${opts.orderId}`,
  });
  const session = await w.request<{ id: string; url: string; payment_intent: string }>('POST', '/v1/checkout/sessions', {
    body: { payment_intent: pi.id, success_url: opts.successUrl, cancel_url: opts.cancelUrl },
    idempotencyKey: `cs-${opts.orderId}`,
  });
  return { paymentIntentId: pi.id, checkoutUrl: session.url };
}

export async function retrieveIntent(id: string): Promise<PaymentIntent> {
  return wire().paymentIntents.retrieve(id);
}

export const isSucceeded = (pi: Pick<PaymentIntent, 'status'>) => pi.status === 'succeeded';
export const isDead = (pi: Pick<PaymentIntent, 'status'>) => pi.status === 'canceled' || pi.status === 'failed';
