'use client';
import { useState } from 'react';

/** Creates the order server-side and jumps to the QPay checkout. */
export default function PayButton({ templateId, pageId, label, size = 'lg' }: { templateId?: string; pageId?: string; label: string; size?: 'lg' | 'sm' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    setBusy(true); setErr('');
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ templateId, pageId }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
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
