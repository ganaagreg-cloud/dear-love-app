import Link from 'next/link';
import { notFound } from 'next/navigation';
import TemplateView from '@/templates/TemplateView';
import { formatMnt, getTemplate, resolveContent } from '@/templates/registry';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  return { title: t ? `${t.name} — жишээ` : 'Жишээ' };
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  if (!t) notFound();
  return (
    <>
      <TemplateView templateId={t.id} content={resolveContent(t, null, true)} />
      <div className="pbar-demo">Жишээ</div>
      <div className="pbar">
        <Link href="/#templates" className="back">← <span>Бүх загвар</span></Link>
        <span className="pname">{t.name}</span>
        <span className="pprice">{formatMnt(t.price)}</span>
        <Link href={`/buy/${t.id}`} className="btn btn-rose btn-sm">Өөрийнхөөрөө хийх</Link>
      </div>
    </>
  );
}
