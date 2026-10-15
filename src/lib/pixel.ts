'use client';

/**
 * Meta (Facebook) Pixel — off unless NEXT_PUBLIC_META_PIXEL_ID is set. Loaded lazily by the first
 * event, only from the shop pages ((site) group): never on a recipient's gift page or in the editor.
 */
const ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string };
type W = Window & { fbq?: Fbq; _fbq?: Fbq };

/** Meta's standard loader stub: queues calls until fbevents.js arrives. */
function fbq(): Fbq | null {
  if (!ID || typeof window === 'undefined') return null;
  const w = window as W;
  if (!w.fbq) {
    const n = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params
      if (n.callMethod) n.callMethod.apply(n, arguments as unknown as unknown[]); else n.queue.push(arguments);
    } as unknown as Fbq;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    w.fbq = n; w._fbq ??= n;
    const s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    n('init', ID);
  }
  return w.fbq;
}

export const pageView = () => fbq()?.('track', 'PageView');

/** Standard event. `eventID` lets Meta de-duplicate (e.g. the order id for Purchase). */
export function track(event: 'ViewContent' | 'InitiateCheckout' | 'Purchase', params: Record<string, unknown>, eventID?: string) {
  const f = fbq();
  if (!f) return;
  if (eventID) f('track', event, params, { eventID }); else f('track', event, params);
}

/** Purchase fires once per order, even if the buyer reloads or revisits the payment page. */
export function trackPurchaseOnce(orderId: string, params: Record<string, unknown>) {
  if (!ID) return;
  const key = `dl_px_purchase_${orderId}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { /* private mode: eventID still de-dupes */ }
  track('Purchase', params, orderId);
}
