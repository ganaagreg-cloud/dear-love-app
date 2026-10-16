#!/usr/bin/env node
// Launch check: run with the PRODUCTION environment before going live / starting ads.
//   vercel env pull .env.production.local && npm run preflight
// Reads the real process env first, then .env.production.local / .env.production / .env (never overriding).
// Exits 1 if anything would break real payments or links.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
for (const f of ['.env.production.local', '.env.production', '.env']) {
  const p = join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^(['"])(.*)\1$/, '$2');
  }
}
const env = (k) => (process.env[k] || '').trim();

const fails = [], warns = [], oks = [];
const check = (ok, good, bad, level = 'fail') => (ok ? oks.push(good) : (level === 'fail' ? fails : warns).push(bad));

// ── site & links
const site = env('NEXT_PUBLIC_SITE_URL');
check(site.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(site), `NEXT_PUBLIC_SITE_URL = ${site}`,
  `NEXT_PUBLIC_SITE_URL must be the public https URL (got "${site || 'unset'}") — payment return links and gift links use it`);
check(!env('NEXT_PUBLIC_ROOT_DOMAIN'), 'NEXT_PUBLIC_ROOT_DOMAIN unset (links are /p/<slug>)',
  `NEXT_PUBLIC_ROOT_DOMAIN is set ("${env('NEXT_PUBLIC_ROOT_DOMAIN')}") — every gift link becomes <slug>.${env('NEXT_PUBLIC_ROOT_DOMAIN')}, which has no wildcard DNS`);

// ── Supabase
check(!!env('NEXT_PUBLIC_SUPABASE_URL') && !!env('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'Supabase URL + anon key set',
  'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing — the site would run on the demo file store (or refuse logins)');
check(!!env('SUPABASE_SERVICE_ROLE_KEY'), 'SUPABASE_SERVICE_ROLE_KEY set', 'SUPABASE_SERVICE_ROLE_KEY missing — every save/order would fail');

// ── Wire / QPay
const key = env('WIRE_API_KEY');
check(key.startsWith('sk_live_'), 'WIRE_API_KEY is a live key',
  key ? `WIRE_API_KEY is not a live key (${key.slice(0, 8)}…) — test payments would unlock gifts for free` : 'WIRE_API_KEY missing — checkout disabled');
check(!!env('WIRE_WEBHOOK_SECRET'), 'WIRE_WEBHOOK_SECRET set',
  'WIRE_WEBHOOK_SECRET missing — gifts only unlock while the buyer keeps the payment page open');
const ops = env('WIRE_ALLOWED_OPERATORS');
check(!!ops && !ops.split(',').map((s) => s.trim()).includes('sandbox'), `WIRE_ALLOWED_OPERATORS = ${ops}`,
  `WIRE_ALLOWED_OPERATORS is "${ops || 'unset (defaults to sandbox)'}" — set it to the live operator id Wire gave you (e.g. qpay)`);
for (const k of ['DEMO_MODE', 'ALLOW_MOCK_PAYMENTS', 'LOCAL_MOCK_PAYMENTS']) {
  check(env(k) !== '1', `${k} off`, `${k}=1 — fake payments / demo login would be possible on the live site`);
}

// ── prices (src/templates/*/meta.ts is the only source of truth)
const tdir = join(root, 'src/templates');
for (const id of readdirSync(tdir)) {
  const meta = join(tdir, id, 'meta.ts');
  if (!existsSync(meta)) continue;
  const price = Number(readFileSync(meta, 'utf8').match(/^\s*price:\s*([\d_]+)/m)?.[1]?.replace(/_/g, '') ?? NaN);
  check(price >= 1000, `${id}: ${price.toLocaleString('en-US')}₮`, `${id}: price is ${price}₮ — still a test price? (src/templates/${id}/meta.ts)`);
}

// ── payment-amount workaround (src/lib/wire.ts toMinor)
const wire = readFileSync(join(root, 'src/lib/wire.ts'), 'utf8');
if (/toMinor = \(mnt: number\) => Math\.round\(mnt\);/.test(wire)) {
  warns.push('src/lib/wire.ts still sends whole ₮ (Wire minor-unit workaround) — after any price change make one real purchase and check the exact amount on the bank statement; reconcile Wire payouts vs orders weekly');
}

// ── marketing / support
check(!!env('NEXT_PUBLIC_META_PIXEL_ID'), 'Meta Pixel configured', 'NEXT_PUBLIC_META_PIXEL_ID unset — Facebook ads cannot measure or optimise for purchases', 'warn');
check(!!(env('NEXT_PUBLIC_CONTACT_EMAIL') || env('NEXT_PUBLIC_CONTACT_PHONE') || env('NEXT_PUBLIC_CONTACT_FACEBOOK')), 'support contact configured',
  'No NEXT_PUBLIC_CONTACT_* set — buyers with a payment problem have no way to reach you', 'warn');

for (const s of oks) console.log(`  ✓ ${s}`);
for (const s of warns) console.log(`  ! ${s}`);
for (const s of fails) console.log(`  ✗ ${s}`);
console.log(`\n${fails.length ? `NOT READY — ${fails.length} blocking problem(s)` : 'Ready'}${warns.length ? `, ${warns.length} warning(s)` : ''}.`);
console.log('Not checked here (do by hand): Google OAuth consent screen is "In production"; Supabase migrations 0001–0003 applied; Wire webhook URL registered; one real purchase on a phone from a Facebook link.');
process.exit(fails.length ? 1 : 0);
