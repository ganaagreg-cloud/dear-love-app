import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TemplateView from '@/templates/TemplateView';
import { getTemplate, resolveContent } from '@/templates/registry';
import { store } from '@/lib/store';
import type { Content } from '@/templates/types';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) return null;
  return store().getPublishedBySlug(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await load((await params).slug);
  return {
    title: page ? 'Танд зориулж хийсэн ♡' : 'Олдсонгүй',
    robots: { index: false, follow: false },
    openGraph: { title: 'Хэн нэгэн танд зориулж юм хийжээ ♡', description: 'Тайван нэг минут гаргаад нээгээрэй.' },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await load((await params).slug);
  const t = page && getTemplate(page.template_id);
  if (!page || !t) notFound();
  return <TemplateView templateId={t.id} content={resolveContent(t, page.content as Content)} />;
}
