'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PayButton from '@/components/PayButton';
import { trackPurchaseOnce } from '@/lib/pixel';
import Contact from '@/components/Contact';
import { hasContact } from '@/lib/contact';

/** Who to ask when a payment looks stuck — with the order reference support needs. */
const Help = ({ orderId }: { orderId: string }) => (
  <p className="small muted" style={{ margin: 0 }}>
    Захиалгын дугаар: <b>{orderId.slice(0, 8)}</b>{hasContact() && <> · Асуудал гарвал: <Contact inline /></>}
  </p>
);

type S = { status: 'pending' | 'paid' | 'failed' | 'canceled'; pageId: string; checkoutUrl: string | null; amount: number; templateId: string } | null;

export default function PayStatus({ orderId, canceled }: { orderId: string; canceled: boolean }) {
  const [s, setS] = useState<S>(null);
  const [err, setErr] = useState('');
  const tries = useRef(0);

  useEffect(() => {
    let stop = false, timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      tries.current++;
      const r = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (stop) return;
      if (!r.ok || !j) { setErr(j?.error || 'Төлбөрийн мэдээллийг ачаалж чадсангүй'); return; }
      setS(j);
      if (j.status === 'paid') {
        trackPurchaseOnce(orderId, { content_ids: [j.templateId], content_type: 'product', value: j.amount, currency: 'MNT', num_items: 1 });
        timer = setTimeout(() => (window.location.href = `/edit/${j.pageId}`), 1200); return;
      }
      if (j.status === 'pending' && tries.current < 150) timer = setTimeout(tick, tries.current < 20 ? 2000 : 4000);
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [orderId]);

  if (err) return <div className="panel center" role="status" aria-live="polite"><h1>Уучлаарай…</h1><p className="err">{err}</p><Link className="btn" href="/dashboard">Миний хуудсууд</Link><Help orderId={orderId} /></div>;
  if (!s) return <div className="panel center" role="status" aria-live="polite"><div className="spinner" /><p className="muted">Төлбөрийг шалгаж байна…</p></div>;

  if (s.status === 'paid') return (
    <div className="panel center stack" role="status" aria-live="polite">
      <div style={{ fontSize: 44 }}>💝</div>
      <h1>Төлбөр амжилттай</h1>
      <p className="muted" style={{ margin: 0 }}>Таны хуудас нээгдлээ. Засварлагч руу шилжиж байна…</p>
      <Link className="btn btn-rose" href={`/edit/${s.pageId}`}>Засварлагч нээх</Link>
    </div>
  );

  if (s.status === 'pending') return (
    <div className="panel center stack" role="status" aria-live="polite">
      <div className="spinner" />
      <h1>QPay-г хүлээж байна…</h1>
      <p className="muted small" style={{ margin: 0 }}>
        {canceled ? 'Төлбөрийн хуудсыг хаасан бололтой.' : 'Банкны аппаараа төлбөрөө хийнэ үү — энэ хуудас өөрөө шинэчлэгдэнэ.'}
      </p>
      {s.checkoutUrl && <a className="btn btn-rose" href={s.checkoutUrl}>Төлбөрийн хуудас нээх</a>}
      <Link className="btn btn-ghost btn-sm" href="/dashboard">Дараа төлье</Link>
      <Help orderId={orderId} />
    </div>
  );

  return (
    <div className="panel center stack" role="status" aria-live="polite">
      <h1>Төлбөр {s.status === 'canceled' ? 'цуцлагдлаа' : 'амжилтгүй боллоо'}</h1>
      <p className="muted small" style={{ margin: 0 }}>Мөнгө хасагдаагүй. Дахин оролдож болно.</p>
      <PayButton pageId={s.pageId} label="Дахин төлөх" />
      <Help orderId={orderId} />
    </div>
  );
}
