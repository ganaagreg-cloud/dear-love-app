import { notFound, redirect } from 'next/navigation';
import Editor from '@/components/editor/Editor';
import { getUser } from '@/lib/supabase/server';
import { ownedPage } from '@/lib/pages';
import { store } from '@/lib/store';
import { ROOT_DOMAIN, SITE_URL, pageUrl } from '@/lib/env';
import { getTemplate, resolveContent } from '@/templates/registry';
import type { Content } from '@/templates/types';

export const metadata = { title: 'Засварлагч', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=/edit/${pageId}`);
  const page = await ownedPage(pageId, user.id);
  if (!page) notFound();
  if (!page.paid_at) redirect('/dashboard'); // editing unlocks only after payment
  const meta = getTemplate(page.template_id);
  if (!meta) notFound();
  // a missing user_prefs table (migration 0002 not applied yet) just means «not seen» — the client also remembers it locally
  const flags = await store().getUserFlags(user.id).catch(() => ({} as Record<string, boolean>));
  return (
    <Editor
      meta={meta}
      pageId={page.id}
      userId={user.id}
      initialContent={resolveContent(meta, page.content as Content)}
      initialStatus={page.status === 'published' ? 'published' : 'paid'}
      initialSlug={page.slug}
      initialUrl={page.slug ? pageUrl(page.slug) : ''}
      linkBase={ROOT_DOMAIN ? `.${ROOT_DOMAIN}` : `${SITE_URL.replace(/^https?:\/\//, '')}/p/`}
      subdomain={!!ROOT_DOMAIN}
      introSeen={!!flags.editorIntro}
    />
  );
}
