import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer, DEMO_COOKIE } from '@/lib/supabase/server';
import { isDemo } from '@/lib/env';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url), { status: 303 });
  if (isDemo()) res.cookies.delete(DEMO_COOKIE);
  else await (await supabaseServer()).auth.signOut();
  return res;
}
