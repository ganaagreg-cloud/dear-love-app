import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isDemo, supabaseConfigured } from '../env';

export const DEMO_COOKIE = 'dl_demo_uid';
export type AppUser = { id: string; email?: string | null; name?: string | null; avatar?: string | null; demo?: boolean };

/** Supabase client bound to the visitor's session cookies (respects RLS). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* called from a Server Component — proxy.ts refreshes the session */ }
      },
    },
  });
}

/** Signed-in user (Google via Supabase, or the local demo user). Never throws. */
export async function getUser(): Promise<AppUser | null> {
  if (isDemo()) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    return id && /^demo-[a-z0-9-]{6,40}$/.test(id) ? { id, name: 'Туршилтын хэрэглэгч', demo: true } : null;
  }
  if (!supabaseConfigured()) return null;
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const u = data.user;
  if (!u) return null;
  return { id: u.id, email: u.email, name: (u.user_metadata?.full_name as string) ?? null, avatar: (u.user_metadata?.avatar_url as string) ?? null };
}
