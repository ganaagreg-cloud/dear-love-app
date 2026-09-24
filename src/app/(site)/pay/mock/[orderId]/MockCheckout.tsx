'use client';
import { useEffect, useState } from 'react';

export default function MockCheckout({ orderId }: { orderId: string }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch(`/api/orders/${orderId}`).then((r) => r.json()).then((j) => setAmount(j.amount ?? null)); }, [orderId]);
  const act = async (outcome: 'paid' | 'cancel') => {
    setBusy(true);
    await fetch(`/api/orders/${orderId}/mock`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ outcome }) });
    window.location.href = `/pay/${orderId}${outcome === 'cancel' ? '?canceled=1' : ''}`;
  };
  return (
    <div className="panel center mock stack">
      <span className="eyebrow" style={{ alignSelf: 'center' }}>🧪 Туршилтын горим — бодит мөнгө биш</span>
      <h1>QPay</h1>
      <p className="muted small" style={{ margin: 0 }}>Wire түлхүүр оруулаагүй тул энэ хуудас QPay төлбөрийг дуурайж байна.</p>
      <div className="qr" />
      <div className="price" style={{ fontSize: '1.6rem' }}>{amount != null ? `${amount.toLocaleString('en-US')}₮` : '…'}</div>
      <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => act('paid')}>Төлбөр амжилттай болсныг дуурайх</button>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act('cancel')}>Цуцлах</button>
    </div>
  );
}
