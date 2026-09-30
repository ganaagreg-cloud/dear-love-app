import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { store } from '@/lib/store';

/** One-time UI flags the client may set for itself. Anything else is refused. */
const FLAGS = new Set(['editorIntro']);

/** POST { flag, value? } — e.g. { flag: 'editorIntro' } once the editor intro was seen or skipped. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Эхлээд нэвтэрнэ үү' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.flag !== 'string' || !FLAGS.has(body.flag)) return NextResponse.json({ error: 'Буруу хүсэлт' }, { status: 400 });
  await store().setUserFlag(user.id, body.flag, body.value !== false);
  return NextResponse.json({ ok: true });
}
