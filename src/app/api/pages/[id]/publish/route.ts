import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { getUser } from '@/lib/supabase/server';
import { store } from '@/lib/store';
import { ownedPage } from '@/lib/pages';
import { RESERVED_SLUGS, SLUG_RE, pageUrl } from '@/lib/env';

const randomSlug = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 8);

/**
 * POST { publish?: boolean, slug?: string }
 *  - publish:false → unpublish
 *  - slug → set a custom link name (anu-bat → anu-bat.yourdomain.mn)
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const { id } = await params;
  const page = await ownedPage(id, user.id);
  if (!page) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 });
  if (!page.paid_at) return NextResponse.json({ error: 'Төлбөр шаардлагатай' }, { status: 402 });

  const body = await req.json().catch(() => ({}));
  const db = store();
  if (body.publish === false) {
    await db.updatePage(page.id, { status: 'paid' });
    return NextResponse.json({ ok: true, status: 'paid', slug: page.slug });
  }

  let slug = page.slug;
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const want = body.slug.trim().toLowerCase();
    if (!SLUG_RE.test(want)) return NextResponse.json({ error: 'Зөвхөн латин жижиг үсэг, тоо, зураас (3–40 тэмдэгт)' }, { status: 400 });
    if (RESERVED_SLUGS.has(want)) return NextResponse.json({ error: 'Энэ нэрийг ашиглах боломжгүй' }, { status: 400 });
    if (want !== page.slug && (await db.slugTaken(want, page.id))) return NextResponse.json({ error: 'Энэ нэр аль хэдийн авагдсан байна' }, { status: 409 });
    slug = want;
  }
  for (let i = 0; !slug && i < 6; i++) {
    const s = randomSlug();
    if (!(await db.slugTaken(s))) slug = s;
  }
  if (!slug) return NextResponse.json({ error: 'Линк үүсгэж чадсангүй' }, { status: 500 });

  try {
    await db.updatePage(page.id, { slug, status: 'published', published_at: page.published_at ?? new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Энэ нэр аль хэдийн авагдсан байна' }, { status: 409 }); // unique index race
  }
  return NextResponse.json({ ok: true, status: 'published', slug, url: pageUrl(slug) });
}
