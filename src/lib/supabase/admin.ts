import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '../env';

/** Service-role client. Bypasses RLS — only use after checking auth/ownership yourself. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error('Supabase service role is not configured');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
