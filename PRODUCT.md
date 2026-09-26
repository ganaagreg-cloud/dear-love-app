# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Someone who wants to give a personalized, non-physical gift to another person for a specific
occasion — a romantic partner, but also a friend or family member. The buyer picks a template,
signs in with Google, pays, then fills in the content (photos, names, dates, a message) through a
guided editor. The recipient needs no account: they just open the link the buyer sends them.
Categories on the buy side span romantic ("Хайр"), anniversary/memory ("Ой"), birthday
("Төрсөн өдөр"), asking someone on a date ("Болзоонд урих"), general events ("Бүх үйл явдалд"),
and travel ("Аялал") — romance is the flagship framing (the product name), not the only
supported job.

## Product Purpose

Let a buyer create and send a personalized "digital gift" page for someone else: choose one of
six schema-driven templates, pay for it, customize its content, and publish it to a unique link —
with no account or app required on the recipient's side to view it.

## Positioning

The combination of Mongolia-native payment and language with globally-trending template formats
is what a generic e-card or website-builder competitor doesn't offer together:
- Checkout goes through **QPay via Wire** (`app.wire.mn`), the payment rail Mongolian buyers
  already use and trust — not a foreign card processor.
- The UI and all buyer/recipient-facing copy is in Mongolian by design.
- Templates aren't generic greeting cards; they copy real trending formats (a TikTok-style
  "Dating Wrapped" year-in-review, a Netflix-parody profile, a scrapbook/flipbook, etc.) rebuilt
  natively rather than pointing at someone else's app.

## Operating Context

- **Buy → pay → edit → publish** flow: buying creates a pending page and order, payment happens
  through Wire/QPay (or a mock checkout in local/demo use), editing unlocks only once paid, and
  publishing assigns the page's public slug/subdomain.
- Each published page is served at its own subdomain (`<slug>.dearlove.mn`) via a single wildcard
  DNS entry, so no per-page DNS setup is needed.
- A **demo mode** (file-based store + one-click fake login + mock checkout) lets the whole flow be
  tried and developed against without any real Supabase/Wire accounts; it's how this project is
  normally developed and tested locally.

## Capabilities and Constraints

- Six templates today: Wrapped (year-in-review), Flight (love flight ticket), Quest (adventure
  game), Locket (locket story), Book (scrapbook/flipbook), LoveFlix (Netflix-style parody). Adding
  a template is a defined, repeatable process (schema + view + registry entry + cover image).
  New templates that fit a similar personalized-gift-page shape are expected over time.
  Categories (occasions a template can serve) are open to extension too.
  the per-template price is defined once (in that template's own metadata) and is the only source
  of truth for what's charged — never client-supplied.
- Every buyer-submitted content save is re-validated server-side against the template's schema;
  only declared fields survive, and uploaded media URLs are confined to that page's own storage
  folder. This is a real security boundary, not just UX validation.
- No automated test suite and no lint script are configured in this repo; `tsc --noEmit` is the
  only static check.
- Recipient-facing published pages are intentionally excluded from search indexing
  (`robots: noindex`) — they're private gift pages meant to be shared via direct link, not
  discovered.

## Brand Commitments

- Mongolian-language UI copy is an intentional, durable choice — not a stopgap for a future
  English version. Preserve it in all user-facing strings.
- Domain: `dearlove.mn`.

## Evidence on Hand

Pre-launch / in development: no real paying customers, testimonials, usage numbers, or press yet.
Future work must not invent or imply any of these.

## Product Principles

- Mongolian-first, not Mongolian-translated: copy, payment rail, and cultural references (trending
  formats, occasions) are chosen for this market, not adapted from an English-first product.
- The recipient's experience must stay frictionless: no account, no app install, just a link that
  opens a finished page.
- Trending formats over generic e-cards: each template should feel like a real, recognizable
  format (a Wrapped recap, a streaming-service parody) rather than a generic greeting-card layout.
- Price and content integrity are server-enforced, never trusted from the client, because real
  money and another person's page are on the line.
- Keep the buyer's creative flexibility (photos, music, per-section stories) high without letting
  that flexibility become a security surface (schema-filtered saves, scoped media).
