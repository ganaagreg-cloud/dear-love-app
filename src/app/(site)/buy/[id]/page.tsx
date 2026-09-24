import Link from 'next/link';
import { notFound } from 'next/navigation';
import PayButton from '@/components/PayButton';
import { formatMnt, getTemplate } from '@/templates/registry';

export const metadata = { title: 'Худалдан авах' };

export default async function Buy({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  if (!t) notFound();
  return (
    <div className="page-narrow">
      <div className="panel">
        <div className="buy-cover"><img src={t.cover} alt="" /></div>
        <div className="row between">
          <h1 style={{ margin: 0 }}>{t.name}</h1>
          <span className="price" style={{ fontSize: '1.4rem' }}>{formatMnt(t.price)}</span>
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>{t.description}</p>
        <hr className="divider" />
        <p className="small" style={{ fontWeight: 700, margin: '0 0 10px' }}>Төлбөр төлсний дараа засах боломжтой:</p>
        <ul className="checklist">{t.schema.map((s) => <li key={s.id}>{s.title}</li>)}</ul>
        <hr className="divider" />
        <PayButton templateId={t.id} label={`${formatMnt(t.price)} төлөх`} />
        <p className="small muted center" style={{ margin: '12px 0 0' }}>
          Нэг удаагийн төлбөр · засах эрх зөвхөн танд · <Link href={`/templates/${t.id}`} style={{ textDecoration: 'underline' }}>дахин үзэх</Link>
        </p>
      </div>
    </div>
  );
}
