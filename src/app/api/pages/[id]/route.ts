import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { store } from '@/lib/store';
import { mediaPrefix, ownedPage } from '@/lib/pages';
import { getTemplate } from '@/templates/registry';
import { sanitizeContent } from '@/templates/sanitize';

/** Save the editor content. Owner-only, paid-only, schema-only. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const { id } = await params;
  const page = await ownedPage(id, user.id);
  if (!page) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 });
  if (!page.paid_at) return NextResponse.json({ error: 'Төлбөр шаардлагатай' }, { status: 402 });
  const meta = getTemplate(page.template_id);
  if (!meta) return NextResponse.json({ error: 'Загвар олдсонгүй' }, { status: 400 });

  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: 'Хэт том' }, { status: 413 });
  let body: { content?: unknown } | null = null;
  try { body = JSON.parse(raw); } catch { /* ignore */ }

  const content = sanitizeContent(meta, body?.content, mediaPrefix(user.id, page.id));
  try { await store().updatePage(page.id, { content }); }
  catch { return NextResponse.json({ error: 'Хадгалж чадсангүй' }, { status: 500 }); }
  return NextResponse.json({ ok: true, content });
}
