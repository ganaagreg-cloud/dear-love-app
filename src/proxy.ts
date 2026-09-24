import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
const RESERVED = new Set(['www', 'app', 'api', 'admin']);

/**
 * 1) Subdomains: anu-bat.yourdomain.mn/…  →  /p/anu-bat   (wildcard DNS *.yourdomain.mn → this app)
 * 2) Keeps the Supabase auth cookie fresh and guards /edit, /dashboard, /buy, /pay.
 */
export async function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (ROOT && host !== ROOT && host.endsWith('.' + ROOT)) {
    const sub = host.slice(0, -(ROOT.length + 1));
    if (!sub.includes('.') && !RESERVED.has(sub)) {
      const p = request.nextUrl.pathname;
      if (p === '/' || p === '') {
        const url = request.nextUrl.clone();
        url.pathname = `/p/${sub}`;
        return NextResponse.rewrite(url);
      }
      if (!p.startsWith('/_next') && !p.startsWith('/tpl') && !p.startsWith('/api/media') && !p.startsWith('/covers') && !p.includes('.')) {
        const url = request.nextUrl.clone(); url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  const p = request.nextUrl.pathname;
  if (p.startsWith('/tpl') || p.startsWith('/covers') || p.startsWith('/api') || p.startsWith('/render')) return NextResponse.next();
  const needsAuth = p.startsWith('/edit') || p.startsWith('/dashboard') || p.startsWith('/buy') || p.startsWith('/pay');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });

  let signedIn = false;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = !!user;
  } else {
    signedIn = !!request.cookies.get('dl_demo_uid')?.value; // demo mode
  }

  if (needsAuth && !signedIn) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = `?next=${encodeURIComponent(p + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|woff2?)$).*)'],
};
