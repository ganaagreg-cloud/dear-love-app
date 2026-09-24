import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { isDemo } from '@/lib/env';
import { DEMO_COOKIE } from '@/lib/supabase/server';
import { safeNext } from '@/lib/safeNext';

/** Demo mode only: one-click login that sets a random demo user id. */
export async function POST(req: NextRequest) {
  if (!isDemo()) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  const form = await req.formData().catch(() => null);
  const next = safeNext(String(form?.get('next') ?? ''));
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  const existing = req.cookies.get(DEMO_COOKIE)?.value;
  res.cookies.set(DEMO_COOKIE, existing ?? `demo-${randomUUID()}`, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
