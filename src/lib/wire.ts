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

/** Wire amounts are MNT minor units (x100). Our prices are whole ₮. */
export const toMinor = (mnt: number) => Math.round(mnt) * 100;

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
