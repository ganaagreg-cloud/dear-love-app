import { notFound } from 'next/navigation';
import { getTemplate } from '@/templates/registry';
import RenderFrame from './RenderFrame';

export const metadata = { robots: { index: false } };

/** Used only inside the editor's preview iframe; content arrives via postMessage. */
export default async function RenderPage({ params }: { params: Promise<{ id: string }> }) {
  const t = getTemplate((await params).id);
  if (!t) notFound();
  return <RenderFrame templateId={t.id} initial={t.defaults} />;
}
