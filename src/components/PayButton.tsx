'use client';
import { useState } from 'react';
import { track } from '@/lib/pixel';

/** Creates the order server-side and jumps to the QPay checkout. */
export default function PayButton({ templateId, pageId, label, size = 'lg' }: { templateId?: string; pageId?: string; label: string; size?: 'lg' | 'sm' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    setBusy(true); setErr('');
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ templateId, pageId }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.checkoutUrl) {
      if (process.env.NEXT_PUBLIC_META_PIXEL_ID) {
        track('InitiateCheckout', { content_ids: [j.templateId], content_type: 'product', value: j.amount, currency: 'MNT', num_items: 1 }, `ic-${j.orderId}`);
        await new Promise((res) => setTimeout(res, 300)); // let the pixel request leave before navigating away
      }
      window.location.href = j.checkoutUrl; return;
    }
    if (r.status === 401) { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`; return; }
    setErr(j.error || 'Алдаа гарлаа'); setBusy(false);
  };
  return (
    <div className="stack" style={{ gap: 8 }}>
      <button className={`btn btn-rose ${size === 'lg' ? 'btn-lg btn-block' : 'btn-sm'}`} onClick={go} disabled={busy}>
        {busy ? 'QPay нээж байна…' : <>{label} <span className="qpay-mark">QPay</span></>}
      </button>
      {err && <p className="err center" style={{ margin: 0 }}>{err}</p>}
    </div>
  );
}
