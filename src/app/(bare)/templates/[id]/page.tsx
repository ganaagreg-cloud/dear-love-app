import Link from 'next/link';
import { notFound } from 'next/navigation';
import TemplateView from '@/templates/TemplateView';
import FullscreenGate from '@/components/FullscreenGate';
import CloseDemo from '@/components/CloseDemo';
import { formatMnt, getTemplate, resolveContent } from '@/templates/registry';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  return { title: t ? `${t.name} — жишээ` : 'Жишээ' };
}

export default async function PreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ clean?: string }> }) {
  const t = getTemplate((await params).id);
  if (!t) notFound();
  // ?clean=1 — for screen-recording ads: just the gift, no fullscreen question, no «Жишээ» tag, no bottom bar
  if ((await searchParams).clean === '1') return <TemplateView templateId={t.id} content={resolveContent(t, null, true)} />;
  return (
    <>
      <FullscreenGate><TemplateView templateId={t.id} content={resolveContent(t, null, true)} /></FullscreenGate>
      <div className="pbar-demo">Жишээ</div>
      <div className="pbar">
        <CloseDemo fallback={`/gift/${t.id}`} />
        <span className="pname">{t.name}</span>
        <span className="pprice">{formatMnt(t.price)}</span>
        <Link href={`/buy/${t.id}`} className="btn btn-rose btn-sm">Өөрийнхөөрөө хийх</Link>
      </div>
    </>
  );
}
