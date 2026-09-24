export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Root domain for per-page subdomains, e.g. "dearlove.mn" (or "localhost:3000" locally). Empty = use /p/slug links. */
export const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Demo mode: no Supabase keys → a local file database + one-click demo login, so the whole
 * buy → pay → edit → publish flow can be tried without any accounts. Never on in production
 * unless DEMO_MODE=1 is set on purpose.
 */
export const isDemo = () => !supabaseConfigured() && (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === '1');

/** Public link for a published page. */
export function pageUrl(slug: string) {
  if (ROOT_DOMAIN) {
    const proto = SITE_URL.startsWith('http://') ? 'http:' : 'https:';
    return `${proto}//${slug}.${ROOT_DOMAIN}`;
  }
  return `${SITE_URL}/p/${slug}`;
}

export const RESERVED_SLUGS = new Set(['www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp', 'dashboard', 'login', 'p', 'edit', 'buy', 'pay',
  'render', 'templates', 'static', 'assets', 'cdn', 'help', 'support', 'blog', 'auth', 'demo', 'status', 'docs', 'shop']);
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
