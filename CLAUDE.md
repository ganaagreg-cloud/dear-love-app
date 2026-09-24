# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Dear Love (`dearlove.mn`) — a Mongolian "digital love gift" platform. A buyer picks a template, signs in with Google, pays via **QPay through Wire** (`app.wire.mn`, a unified MN payment gateway), then edits and publishes their own page at a unique subdomain: `anu-bat.dearlove.mn`. Six templates: **Wrapped** (year-in-review), **Flight** (love flight ticket), **Quest** (adventure game), **Locket** (locket story), **Book** (scrapbook/flipbook), **LoveFlix** (Netflix-style parody).

UI copy and comments in the codebase are largely in Mongolian; this is intentional and should be preserved in user-facing strings.

## Commands

```bash
npm run dev         # start dev server (localhost:3000)
npm run build        # next build
npm start             # next start (production server)
npm run typecheck    # tsc --noEmit — run this after any change, it's the only static check configured
```

There is no test suite and no lint script configured in this repo.

### Demo mode (no accounts needed)

If `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, the app runs in demo mode: a JSON file at `.demo-data/db.json` stands in for the database, "Туршилтын горимоор нэвтрэх" (demo login) sets a `dl_demo_uid` cookie instead of real auth, and checkout shows a mock QPay page. See `src/lib/env.ts::isDemo()` — demo mode is forced off in production unless `DEMO_MODE=1` is explicitly set. Delete `.demo-data/` to reset.

## Architecture

### Data layer is swappable: Supabase vs. a JSON file

`src/lib/store.ts` defines a single `Store` interface (`getPage`, `createOrder`, `markPagePaid`, `recordEvent`, ...) with two implementations: `sbStore` (Supabase/Postgres) and `fileStore` (a JSON file under `.demo-data/`, serialized through a promise chain so concurrent writes can't race). `store()` picks one based on `isDemo()`. **Any new persistence feature must be added to the `Store` interface and implemented in both.** The Postgres schema (tables, RLS policies, the `media` storage bucket) lives in `supabase/migrations/0001_init.sql`.

### Template system is schema-driven

Each template under `src/templates/<id>/` exports a `meta.ts` (`TemplateMeta`: id, price — **the only source of truth for what's charged** — cover image, `schema: Section[]` describing editable fields, `defaults`, and `demo` preview overrides) and a `View.tsx` (`({ content }) => ...`). `src/templates/registry.ts` lists all templates (`TEMPLATES`) and resolves what to render via `resolveContent`: `defaults ← demo (if previewing) ← buyer's saved content`.

To add a template: create `src/templates/<id>/{meta.ts,View.tsx}`, register it in `src/templates/registry.ts` and `src/templates/TemplateView.tsx`, add `public/covers/<id>.jpg`. The editor (`src/components/editor/Editor.tsx`), field validation, live preview, and publish flow all work automatically off the `schema`.

Field types are declared in `src/templates/types.ts` (`Field`: text, textarea, image, images, audio, color, date, select, toggle, list, spotify). **Every save is re-validated server-side** by `src/templates/sanitize.ts::sanitizeContent()`, which is the real security boundary: only schema-declared keys survive, values are coerced/clipped to their field type, and image/audio URLs are rejected unless they start with the page's own media prefix (`src/lib/pages.ts::mediaPrefix`, scoped to `<userId>/<pageId>/`). Never trust client-submitted content without this pass.

### Request flow: buy → pay → edit → publish

1. **Buy** (`src/app/(site)/buy/[id]`) creates a `pages` row (`status: pending_payment`) and an `orders` row, then redirects to Wire checkout (or the mock checkout at `pay/mock/[orderId]` in demo/dev).
2. **Pay**: Wire webhook (`src/app/api/webhooks/wire/route.ts`) verifies the signature, dedupes by event id (`store().recordEvent`), then **re-fetches the PaymentIntent from Wire's API** (never trusts the webhook payload alone) and checks status + exact amount before calling `markOrderPaid` → `store().markPagePaid` (idempotent — only flips `pending_payment → paid` once). On handler failure it calls `forgetEvent` so Wire retries.
3. **Edit** (`src/app/(bare)/edit/[pageId]`): `PATCH /api/pages/[id]` requires the caller to own the page (`ownedPage`) and the page to be paid (`page.paid_at`), then runs `sanitizeContent` before saving.
4. **Publish** (`src/app/api/pages/[id]/publish`): assigns/validates the slug (`SLUG_RE`, `RESERVED_SLUGS` in `src/lib/env.ts`) and flips `status: published`.
5. **View**: `src/app/(bare)/p/[slug]` serves the published page.

### Subdomain routing

`src/proxy.ts` (Next.js middleware) rewrites `anu-bat.dearlove.mn/` → `/p/anu-bat` when the host is a subdomain of `NEXT_PUBLIC_ROOT_DOMAIN` and not in the reserved set (`www`, `app`, `api`, `admin`). It also refreshes the Supabase auth cookie and gates `/edit`, `/dashboard`, `/buy`, `/pay` behind sign-in (or the demo cookie when Supabase isn't configured), redirecting to `/login?next=...`. A single wildcard DNS entry (`*.dearlove.mn` → Vercel, nameservers pointed at `ns1/ns2.vercel-dns.com`) makes every buyer's subdomain work without per-page DNS.

### Route groups

- `src/app/(site)` — chrome'd pages: home, login, buy, pay, dashboard.
- `src/app/(bare)` — full-screen, no site chrome: template preview (`templates/[id]`), the editor (`edit/[pageId]`), the iframe render target (`render/[id]`), and published pages (`p/[slug]`).
- `src/app/api` — orders, page save/publish, uploads, the Wire webhook.

### Auth

`src/lib/supabase/{client,server,admin}.ts` — `server.ts`'s `getUser()` is the source of truth for the signed-in user in API routes/server components; `admin.ts`'s `supabaseAdmin()` uses the service-role key and bypasses RLS (only ever used from `store.ts`'s `sbStore`, never exposed to routes directly). In demo mode there's no real Supabase client; auth is a `dl_demo_uid` cookie set by `src/app/auth/demo/route.ts`.

### Security invariants worth knowing before touching related code

- Prices only ever come from `src/templates/*/meta.ts` server-side — never from client input.
- RLS means the client can't write to Postgres directly; all writes go through validated API routes.
- Payment confirmation always re-checks status *and amount* against Wire's API, not the webhook body.
- Content saves are schema-filtered (`sanitizeContent`) and media URLs are confined to the owning page's folder.
- Uploaded images are resized/re-encoded client-side before upload (strips EXIF/GPS).
