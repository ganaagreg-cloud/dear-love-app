# Editor Page Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** While a buyer has a schema section open in the editor, the live preview locks onto the exact slide/scene/screen/page that section affects and stops auto-advancing, instead of racing ahead on its own timers while they're still typing.

**Architecture:** A new optional `pin: string | number | null` field rides alongside `content` in the existing `Editor.tsx` → iframe `postMessage` protocol, computed from whichever schema section is currently open (`meta.schema[...].previewPage`). Each of the four in-scope templates (Wrapped, Flight, LoveFlix, Book) accepts `pin` as a new prop and uses it to set its initial navigation state (for the three that remount on every keystroke) or react to it (LoveFlix, which doesn't remount), plus suppresses any unconditional auto-advance timer while pinned. Quest and Locket are untouched — out of scope, confirmed unable to support this mechanism (see spec).

**Tech Stack:** Next.js App Router, React 19, TypeScript. No test framework in this repo — verification is `npm run typecheck` plus manual browser checks, per existing project convention (`CLAUDE.md`).

**Spec:** `docs/superpowers/specs/2026-09-26-editor-page-mode-design.md`

## Global Constraints

- `pin` is always optional and defaults to `null`/absent — every consumer must behave exactly as it does today when `pin` is not provided (published page `/p/[slug]`, standalone preview `/templates/[id]`, and Quest/Locket everywhere).
- Book's schema restructuring must not change any field's `key` — already-saved buyer content must load identically before and after.
- No new dependencies. No new test framework introduced.
- Mongolian UI copy conventions: short, terse labels matching the existing editor toolbar (`Засах`, `Харах`, `Нийтлэх`).

## Review Focus

- Wrapped: the pinned section's target slide isn't currently in `slides[]` (e.g. every song title was cleared while "Топ 5 дуу" is open) — must fall back to the cover, never crash or render blank. (Task 1)
- LoveFlix: pinning to `'episode'` while `sceneStep` is left over at `2` (climax) from a prior full-preview session — must reset to the first episode scene (`sceneStep = 0`), not resume mid-climax. (Task 5)
- Book: the schema split must preserve all 20 original field keys with no loss or duplication, and previously-saved content under those keys must still populate the new sections correctly. (Task 6)
- Switching sections fast (open "ticket" then immediately "route") relies on the existing 700ms debounce already covering `pin` changes, not just `content` changes — must not flash the wrong scene before settling. (Task 1)
- The preview toggle and section-open state must never be sent to `/api/pages/[id]` or mark the page dirty — only `content` is persisted; toggling preview/pin must not trigger the "unsaved changes" `beforeunload` warning. (Task 2)

---

## Task 1: Extend the postMessage protocol with `pin`, and make Wrapped honor it

This is the full vertical slice that proves the mechanism end to end, using Wrapped
(the best-understood template) before repeating the pattern for the others.

**Files:**
- Modify: `src/templates/types.ts`
- Modify: `src/components/editor/Editor.tsx`
- Modify: `src/app/(bare)/render/[id]/RenderFrame.tsx`
- Modify: `src/templates/TemplateView.tsx`
- Modify: `src/templates/wrapped/meta.ts`
- Modify: `src/templates/wrapped/View.tsx`
- Modify: `src/templates/wrapped/Wrapped.tsx`

**Interfaces:**
- Produces: `Section.previewPage?: string | number` (types.ts) — consumed by every later task's `meta.ts` changes.
- Produces: the `{ type: 'dear:content', content, pin }` message shape — consumed by `RenderFrame.tsx` and, transitively, every `View.tsx` in later tasks.
- Produces: `TemplateView({ templateId, content, pin? })` — every `View.tsx` in later tasks receives `pin` the same way.

- [ ] **Step 1: Add `previewPage` to the `Section` type**

In `src/templates/types.ts`, find:

```ts
export type Section = { id: string; title: string; description?: string; fields: Field[] };
```

Replace with:

```ts
export type Section = {
  id: string; title: string; description?: string; fields: Field[];
  /** Which slide/scene/screen/page in the template's own preview this section's fields affect — drives the editor's live-preview pinning. */
  previewPage?: string | number;
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes with zero errors (this is a purely additive optional field).

- [ ] **Step 3: Add `previewPage` to Wrapped's schema sections**

In `src/templates/wrapped/meta.ts`, the `schema` array has 8 sections with ids
`basics`, `moment`, `songs`, `places`, `words`, `persona`, `photos`, `message`. Add
`previewPage` to each section object (alongside its existing `id`/`title`):

```ts
{ id: 'basics', title: 'Үндсэн', previewPage: '__intro__', fields: [...] },
{ id: 'moment', title: 'Таны №1 мөч', previewPage: 'top', fields: [...] },
{ id: 'songs', title: 'Топ 5 дуу', previewPage: 'songs', fields: [...] },
{ id: 'places', title: 'Топ 5 газар', previewPage: 'places', fields: [...] },
{ id: 'words', title: 'Хамгийн их хэлдэг үгс', previewPage: 'words', fields: [...] },
{ id: 'persona', title: 'Хайрын төрөл', previewPage: 'persona', fields: [...] },
{ id: 'photos', title: 'Зургийн цуглуулга', previewPage: 'photos', fields: [...] },
{ id: 'message', title: 'Мессеж', previewPage: 'msg', fields: [...] },
```

(Keep every section's existing `fields` array exactly as-is — only add the
`previewPage` key. Section titles above are copied from the current file for
orientation; don't change them.)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Compute and send `pin` from `Editor.tsx`**

In `src/components/editor/Editor.tsx`, find:

```ts
  const post = useCallback(() => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current }, window.location.origin), []);
```

Replace with:

```ts
  const pin = meta.schema.find((s) => s.id === open)?.previewPage ?? null;
  const post = useCallback(
    () => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current, pin }, window.location.origin),
    [pin],
  );
```

(The existing `useEffect(() => { const t = setTimeout(post, 700); return () => clearTimeout(t); }, [content, post]);` a few lines below needs no change — it already re-runs whenever `post`'s identity changes, and `post` now changes identity whenever `pin` changes, so opening a different section re-posts automatically through the same 700ms debounce.)

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 7: Receive `pin` in `RenderFrame.tsx` and thread it to `TemplateView`**

In `src/app/(bare)/render/[id]/RenderFrame.tsx`, replace the whole file with:

```tsx
'use client';
import { useEffect, useState } from 'react';
import TemplateView from '@/templates/TemplateView';
import type { Content } from '@/templates/types';

export default function RenderFrame({ templateId, initial }: { templateId: string; initial: Content }) {
  const [content, setContent] = useState<Content | null>(null);
  const [pin, setPin] = useState<string | number | null>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'dear:content' && e.data.content && typeof e.data.content === 'object') {
        setContent(e.data.content);
        setPin(e.data.pin ?? null);
      }
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'dear:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return <TemplateView templateId={templateId} content={content ?? initial} pin={pin} />;
}
```

- [ ] **Step 8: Thread `pin` through `TemplateView`**

Replace `src/templates/TemplateView.tsx` with:

```tsx
'use client';
import dynamic from 'next/dynamic';
import type { Content } from './types';

const VIEWS = {
  locket: dynamic(() => import('./locket/View'), { ssr: false }),
  book: dynamic(() => import('./book/View'), { ssr: false }),
  netflix: dynamic(() => import('./netflix/View'), { ssr: false }),
  quest: dynamic(() => import('./quest/View'), { ssr: false }),
  wrapped: dynamic(() => import('./wrapped/View'), { ssr: false }),
  flight: dynamic(() => import('./flight/View'), { ssr: false }),
} as const;

export default function TemplateView({ templateId, content, pin }: {
  templateId: string; content: Content; pin?: string | number | null;
}) {
  const View = VIEWS[templateId as keyof typeof VIEWS];
  if (!View) return null;
  return <View content={content} pin={pin ?? null} />;
}
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: **fails** — every `View.tsx` component (`locket`, `book`, `netflix`, `quest`,
`wrapped`, `flight`) now receives a `pin` prop its type signature doesn't declare.
This is expected; each one gets `pin?: string | number | null` added to its own prop
signature — Quest and Locket right now in Step 10 below (since those two never change
again after this), Wrapped later in this same task, and `netflix`/`book`/`flight` in
their own later tasks.

- [ ] **Step 10: Silence the type error for Quest and Locket (out of scope, but must still typecheck)**

In `src/templates/quest/View.tsx`, find:

```ts
export default function QuestView({ content }: { content: Content }) {
```

Replace with:

```ts
export default function QuestView({ content }: { content: Content; pin?: string | number | null }) {
```

In `src/templates/locket/View.tsx`, find:

```ts
export default function LocketView({ content }: { content: Content }) {
```

Replace with:

```ts
export default function LocketView({ content }: { content: Content; pin?: string | number | null }) {
```

Neither file uses the new prop anywhere else — this is purely accepting-and-ignoring
it, matching the spec ("a pure no-op for templates outside scope").

- [ ] **Step 11: Typecheck**

Run: `npm run typecheck`
Expected: still fails on `netflix`, `book`, `flight` (their tasks come later) and now
also `wrapped` (Step 12 below fixes that one).

- [ ] **Step 12: Thread `pin` through Wrapped's `View.tsx`**

In `src/templates/wrapped/View.tsx`, find:

```tsx
export default function WrappedView({ content }: { content: Content }) {
  const data = useMemo(() => toWrapped(content), [content]);
  return <Wrapped key={JSON.stringify(data).length} data={data} />;
}
```

Replace with:

```tsx
export default function WrappedView({ content, pin }: { content: Content; pin?: string | number | null }) {
  const data = useMemo(() => toWrapped(content), [content]);
  return <Wrapped key={JSON.stringify(data).length} data={data} pin={pin} />;
}
```

- [ ] **Step 13: Make `Wrapped.tsx` honor `pin`**

In `src/templates/wrapped/Wrapped.tsx`, find:

```ts
export default function Wrapped({ data }: { data: WrappedData }) {
```

Replace with:

```ts
export default function Wrapped({ data, pin }: { data: WrappedData; pin?: string | number | null }) {
```

A few lines later, find:

```ts
  const [i, setI] = useState(-1);
```

Replace with:

```ts
  const pinnedIndex = pin === '__intro__' ? -1 : pin ? slides.findIndex((sl) => sl.id === pin) : -1;
  const [i, setI] = useState(pin === '__intro__' || pinnedIndex >= 0 ? pinnedIndex : -1);
```

(This runs after `slides` is built earlier in the function, so `slides.findIndex` sees
the real, current slide list. If the target slide isn't present — e.g. all songs were
cleared while "Топ 5 дуу" is open — `pinnedIndex` is `-1` and the preview falls back to
the cover, matching Review Focus item 1.)

Then find the auto-advance effect:

```ts
  useEffect(() => {
    if (i < 0 || paused || i === last) return;
```

Replace the condition with:

```ts
  useEffect(() => {
    if (i < 0 || paused || i === last || pin) return;
```

(Any truthy `pin` — including `'__intro__'` — stops auto-advance outright. Combined
with the initializer above, a pinned Wrapped preview lands directly on the right slide
and sits there.)

- [ ] **Step 14: Typecheck**

Run: `npm run typecheck`
Expected: still fails on `netflix`, `book`, `flight` only (their own tasks fix them).
`wrapped` and the shared plumbing now typecheck clean.

- [ ] **Step 15: Manual verification**

1. Run the dev server (`npm run dev`), sign in via demo mode, buy the Wrapped
   ("Бидний жил · Wrapped") template, and open its editor.
2. Open the "Таны №1 мөч" section. Confirm the preview jumps to and stays on the "№1
   мөч" slide (not the cover, not auto-advancing to the next slide after ~7s).
3. Open "Топ 5 дуу". Confirm the preview jumps to the songs slide and stays there.
4. Open "Үндсэн" (basics). Confirm the preview returns to the cover/intro screen (the
   "Эхлье ▶" button), not the last slide it was on.
5. Confirm typing in any field no longer causes any visible slide flicker beyond the
   normal 700ms-debounced content update.
6. Open "Топ 5 дуу" and clear every song title field (leave all 5 blank). Confirm the
   preview falls back to the cover screen rather than crashing or rendering a blank
   slide — this is the empty-slide fallback from Review Focus item 1. Restore the
   values afterward.
7. Click rapidly between "Таны №1 мөч", "Топ 5 газар", and "Хайрын төрөл" (three
   different sections) within a couple of seconds. Confirm the preview settles on
   whichever section you stopped on, without visibly flashing through the
   intermediate ones first — this is Review Focus item 4 (the 700ms debounce already
   covers `pin` changes the same way it covers content changes).

- [ ] **Step 16: Commit**

```bash
git add src/templates/types.ts src/components/editor/Editor.tsx "src/app/(bare)/render/[id]/RenderFrame.tsx" src/templates/TemplateView.tsx src/templates/wrapped/meta.ts src/templates/wrapped/View.tsx src/templates/wrapped/Wrapped.tsx src/templates/quest/View.tsx src/templates/locket/View.tsx
git commit -m "Pin editor live preview to the open section (Wrapped)"
```

---

## Task 2: Full-preview toggle

**Files:**
- Modify: `src/components/editor/Editor.tsx`

**Interfaces:**
- Consumes: `pin` computation from Task 1 (`meta.schema.find((s) => s.id === open)?.previewPage`).
- Produces: `previewingFull: boolean` state, folded into the `pin` computation — no new exports, this is entirely internal to `Editor.tsx`.

- [ ] **Step 1: Add `previewingFull` state and fold it into `pin`**

In `src/components/editor/Editor.tsx`, find the line added in Task 1:

```ts
  const pin = meta.schema.find((s) => s.id === open)?.previewPage ?? null;
```

Replace with:

```ts
  const [previewingFull, setPreviewingFull] = useState(false);
  const pin = previewingFull ? null : (meta.schema.find((s) => s.id === open)?.previewPage ?? null);
```

- [ ] **Step 2: Add the toggle button to the toolbar**

Find the toolbar block:

```tsx
        <div className="row">
          <div className="ed-devices">
            <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')} title="Компьютер">🖥</button>
            <button className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')} title="Утас">📱</button>
          </div>
          {status === 'published'
            ? <button className="btn btn-sm btn-rose" onClick={() => setShare(true)}>Хуваалцах</button>
            : <button className="btn btn-sm btn-rose" onClick={publish} disabled={publishing}>{publishing ? 'Нийтэлж байна…' : 'Нийтлэх'}</button>}
        </div>
```

Replace with:

```tsx
        <div className="row">
          <div className="ed-devices">
            <button className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')} title="Компьютер">🖥</button>
            <button className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')} title="Утас">📱</button>
          </div>
          <button
            className={`btn btn-sm ${previewingFull ? 'btn-primary' : ''}`}
            onClick={() => setPreviewingFull((v) => !v)}
            title="Хэсэг тус бүрт зогсолгүй, эхнээс дуустал бүтнээр нь үзэх"
          >
            ▶ Бүтнээр
          </button>
          {status === 'published'
            ? <button className="btn btn-sm btn-rose" onClick={() => setShare(true)}>Хуваалцах</button>
            : <button className="btn btn-sm btn-rose" onClick={publish} disabled={publishing}>{publishing ? 'Нийтэлж байна…' : 'Нийтлэх'}</button>}
        </div>
```

No CSS changes needed — `.btn`, `.btn-sm`, and `.btn-primary` already exist in
`src/app/globals.css`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `netflix`, `book`, `flight` (unrelated, later tasks).

- [ ] **Step 4: Manual verification**

1. In the Wrapped editor, open "Топ 5 дуу" (preview should pin to the songs slide, per
   Task 1).
2. Click "▶ Бүтнээр". Confirm the button visually activates (`btn-primary`) and the
   preview resumes normal autoplay from wherever it's sitting, advancing through
   slides on its own.
3. Click "▶ Бүтнээр" again to turn it off. Confirm the preview immediately returns to
   pinning on the "Топ 5 дуу" section's slide.
4. Confirm neither clicking the toggle nor switching sections changes the "Бүгд
   хадгалагдсан" (all saved) save-status indicator, and does not trigger the
   browser's unsaved-changes warning on tab close — only editing an actual field
   should do that (Review Focus item 5).

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Editor.tsx
git commit -m "Add full-preview toggle to the editor toolbar"
```

---

## Task 3: Next-section button in the editor sidebar

**Files:**
- Modify: `src/components/editor/Editor.tsx`

**Interfaces:**
- Consumes: `meta.schema` (already in scope in `Editor.tsx`), `open`/`setOpen` (already exist).
- Produces: nothing new consumed elsewhere — purely a sidebar navigation convenience.

- [ ] **Step 1: Compute the next section**

In `src/components/editor/Editor.tsx`, find the line added in Task 2:

```ts
  const [previewingFull, setPreviewingFull] = useState(false);
  const pin = previewingFull ? null : (meta.schema.find((s) => s.id === open)?.previewPage ?? null);
```

Immediately after it, add:

```ts
  const openIndex = meta.schema.findIndex((s) => s.id === open);
  const nextSection = openIndex >= 0 ? meta.schema[openIndex + 1] : undefined;
```

- [ ] **Step 2: Add the button to the open section's body**

Find the accordion section body:

```tsx
            {open === s.id && (
              <div className="ed-sec-body" id={`ed-sec-body-${s.id}`}>
                {s.description && <p className="ed-help" style={{ marginTop: 0 }}>{s.description}</p>}
                {s.fields.map((f) => (
                  <FieldControl key={f.key} field={f} value={content[f.key]} onChange={(v) => set(f.key, v)} upload={upload} />
                ))}
              </div>
            )}
```

Replace with:

```tsx
            {open === s.id && (
              <div className="ed-sec-body" id={`ed-sec-body-${s.id}`}>
                {s.description && <p className="ed-help" style={{ marginTop: 0 }}>{s.description}</p>}
                {s.fields.map((f) => (
                  <FieldControl key={f.key} field={f} value={content[f.key]} onChange={(v) => set(f.key, v)} upload={upload} />
                ))}
                {nextSection && (
                  <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setOpen(nextSection.id)}>
                    Дараах: {nextSection.title} →
                  </button>
                )}
              </div>
            )}
```

(`nextSection` is computed once from the currently-`open` section, outside the
`.map()`. It's only rendered inside the block that already requires `open === s.id`,
so by the time this JSX renders, `nextSection` correctly refers to the section right
after `s`. The last section in a schema has no `nextSection`, so it renders no
button — matching the spec's "Нийтлэх already covers what's next" reasoning.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `netflix`, `book`, `flight` (their own later tasks) —
unrelated to this change.

- [ ] **Step 4: Manual verification**

1. In the Wrapped editor, open the first section ("Үндсэн"). Confirm a "Дараах: Таны
   №1 мөч →" button appears below its fields.
2. Click it. Confirm the accordion switches to "Таны №1 мөч" (closing "Үндсэн") and
   the preview updates to match (per Task 1's pinning).
3. Click through every remaining section's "Дараах →" button in turn, ending at
   "Мессеж" (the last section). Confirm no button appears there.
4. Confirm clicking a section header directly (skipping ahead, e.g. straight to
   "Хайрын төрөл" from "Үндсэн") still works exactly as before — the accordion
   remains fully clickable, this button is additive only.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/Editor.tsx
git commit -m "Add next-section button to the editor sidebar"
```

---

## Task 4: Flight support (the reported bug)

**Files:**
- Modify: `src/templates/flight/meta.ts`
- Modify: `src/templates/flight/View.tsx`
- Modify: `src/templates/flight/Flight.tsx`

**Interfaces:**
- Consumes: `pin` prop shape from Task 1 (`string | number | null`), `TemplateView`'s existing pass-through.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Add `previewPage` to Flight's schema sections**

In `src/templates/flight/meta.ts`, the `schema` array has 4 sections. Add
`previewPage` to each:

```ts
{ id: 'ticket', title: 'Тасалбар', previewPage: 'pass', fields: [...] },
{ id: 'route', title: 'Хаанаас → Хаашаа', previewPage: 'board', fields: [...] },
{ id: 'stops', title: 'Замын буудлууд', description: '...', previewPage: 'fly', fields: [...] },
{ id: 'landing', title: 'Газардалт', previewPage: 'land', fields: [...] },
```

(Keep every section's existing `title`, `description`, and `fields` exactly as they
are today — only add `previewPage`.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `netflix`, `book`, `flight`'s prop signature (next
steps fix `flight`).

- [ ] **Step 3: Thread `pin` through Flight's `View.tsx`**

In `src/templates/flight/View.tsx`, find:

```tsx
export default function FlightView({ content }: { content: Content }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} />;
}
```

Replace with:

```tsx
export default function FlightView({ content, pin }: { content: Content; pin?: string | number | null }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} pin={pin} />;
}
```

- [ ] **Step 4: Make `Flight.tsx` honor `pin`**

Find:

```ts
export default function Flight({ data }: { data: FlightData }) {
```

Replace with:

```ts
export default function Flight({ data, pin }: { data: FlightData; pin?: string | number | null }) {
```

Find:

```ts
  const [scene, setScene] = useState<Scene>('board');
```

Replace with:

```ts
  const isScene = (v: unknown): v is Scene => v === 'board' || v === 'pass' || v === 'fly' || v === 'land';
  const [scene, setScene] = useState<Scene>(isScene(pin) ? pin : 'board');
```

Find:

```ts
  useEffect(() => { if (scene === 'board') { const t = setTimeout(() => setScene('pass'), 4200); return () => clearTimeout(t); } }, [scene]);
```

Replace with:

```ts
  useEffect(() => { if (scene === 'board' && !pin) { const t = setTimeout(() => setScene('pass'), 4200); return () => clearTimeout(t); } }, [scene, pin]);
```

(The tear→fly timeout inside the click handler around line 110 needs no guard — it
only runs after the buyer's own click inside the iframe, which sidebar editing never
triggers.)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `netflix`, `book` (their own tasks). `flight` now
typechecks clean.

- [ ] **Step 6: Manual verification (the originally reported bug)**

1. Buy the Flight ("Хайрын нислэг") template, open its editor.
2. Open "Хаанаас → Хаашаа" (route). Confirm the preview shows the departures board
   scene.
3. Type slowly into the route fields, pausing for 5+ seconds between changes (longer
   than the old 4.2s timer). Confirm the board scene **never** auto-advances to the
   boarding pass while this section is open — this is the exact bug reported.
4. Switch to "Тасалбар" (ticket). Confirm the preview jumps to the boarding pass scene.
5. Switch to "Замын буудлууд" (stops). Confirm the preview jumps to the map/journey
   scene.
6. Switch to "Газардалт" (landing). Confirm the preview jumps to the passport/landing
   scene.
7. Click "▶ Бүтнээр" (from Task 2). Confirm the board scene now auto-advances to the
   boarding pass after ~4.2s, exactly like the published experience.

- [ ] **Step 7: Commit**

```bash
git add src/templates/flight/meta.ts src/templates/flight/View.tsx src/templates/flight/Flight.tsx
git commit -m "Pin editor live preview to the open section (Flight)"
```

---

## Task 5: LoveFlix support

**Files:**
- Modify: `src/templates/netflix/meta.ts`
- Modify: `src/templates/netflix/View.tsx`
- Modify: `src/templates/netflix/LoveFlix.tsx`

**Interfaces:**
- Consumes: `pin` prop shape from Task 1.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Add `previewPage` to LoveFlix's schema sections**

In `src/templates/netflix/meta.ts`, the `schema` array has 4 sections. Add
`previewPage` to each:

```ts
{ id: 'basics', title: 'Төрөл ба нэрс', previewPage: 'browse', fields: [...] },
{ id: 'photos', title: 'Зургууд', previewPage: 'browse', fields: [...] },
{ id: 'show', title: 'Цуврал', previewPage: 'browse', fields: [...] },
{ id: 'episode', title: 'Интерактив анги', previewPage: 'episode', fields: [...] },
```

(Keep every section's existing `title` and `fields` exactly as they are today — only
add `previewPage`.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `netflix`, `book`.

- [ ] **Step 3: Thread `pin` through LoveFlix's `View.tsx`**

In `src/templates/netflix/View.tsx`, find:

```tsx
export default function NetflixView({ content }: { content: Content }) {
  const data = useMemo(() => toLoveData(content), [content]);
  return (
    <div style={{ minHeight: '100dvh', background: '#141414' }}>
      <LoveFlix data={data} />
    </div>
  );
}
```

Replace with:

```tsx
export default function NetflixView({ content, pin }: { content: Content; pin?: string | number | null }) {
  const data = useMemo(() => toLoveData(content), [content]);
  return (
    <div style={{ minHeight: '100dvh', background: '#141414' }}>
      <LoveFlix data={data} pin={pin} />
    </div>
  );
}
```

- [ ] **Step 4: Make `LoveFlix.tsx` honor `pin`**

Find:

```ts
export default function LoveFlix({ data }: { data: LoveData }) {
```

Replace with:

```ts
export default function LoveFlix({ data, pin }: { data: LoveData; pin?: string | number | null }) {
```

`LoveFlix.tsx` does not remount on content changes (unlike Wrapped/Flight/Book), so
`pin` needs a reactive effect rather than an initializer. Find:

```ts
  const selectProfile = () => { playTaDum(); setScreen('intro'); };
  useEffect(() => {
    if (screen !== 'intro') return;
    const t = setTimeout(() => setScreen('browse'), 2600);
    return () => clearTimeout(t);
  }, [screen]);
```

Replace with:

```ts
  const selectProfile = () => { playTaDum(); setScreen('intro'); };
  useEffect(() => {
    if (screen !== 'intro' || pin) return;
    const t = setTimeout(() => setScreen('browse'), 2600);
    return () => clearTimeout(t);
  }, [screen, pin]);
  const isScreen = (v: unknown): v is Screen => v === 'profiles' || v === 'intro' || v === 'browse' || v === 'episode' || v === 'credits';
  useEffect(() => {
    if (!isScreen(pin)) return;
    setScreen(pin);
    if (pin === 'episode') setSceneStep(0);
  }, [pin]);
```

(The `if (pin === 'episode') setSceneStep(0)` line is Review Focus item 2: without it,
pinning to the episode screen could resume mid-climax if a buyer had previously
clicked through to `sceneStep === 2` during a full-preview session.)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `book`. `netflix` now typechecks clean.

- [ ] **Step 6: Manual verification**

1. Buy the LoveFlix ("LoveFlix") template, open its editor.
2. Open "Төрөл ба нэрс" (basics). Confirm the preview jumps directly to the browse
   screen (skipping the profile-select and intro screens entirely).
3. Open "Интерактив анги" (episode). Confirm the preview jumps to the first episode
   scene, not wherever a prior full-preview session left it.
4. Click "▶ Бүтнээр" (from Task 2), then click through the profile and intro screens
   manually inside the preview to reach episode 2 or the climax. Turn "▶ Бүтнээр" off
   again while "Интерактив анги" is open — confirm the preview resets to the first
   episode scene, not the climax you were just on.

- [ ] **Step 7: Commit**

```bash
git add src/templates/netflix/meta.ts src/templates/netflix/View.tsx src/templates/netflix/LoveFlix.tsx
git commit -m "Pin editor live preview to the open section (LoveFlix)"
```

---

## Task 6: Book schema split and page-jump support

**Files:**
- Modify: `src/templates/book/meta.ts`
- Modify: `src/templates/book/View.tsx`
- Modify: `src/templates/book/Scrapbook.tsx`

**Interfaces:**
- Consumes: `pin` prop shape from Task 1.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Split Book's `pages` section into six sections**

In `src/templates/book/meta.ts`, find the single `pages` section:

```ts
    {
      id: 'pages', title: 'Хуудасны тэмдэглэлүүд',
      description: 'Шинэ мөр хэрэгтэй газар Enter дарна.',
      fields: [
        { type: 'textarea', key: 'texts.lucky', label: 'Том үг (3-р хуудас)', max: 30, rows: 2 },
        { type: 'textarea', key: 'texts.luckyNote', label: 'Тэмдэглэл (3-р хуудас)', max: 120, rows: 2 },
        { type: 'text', key: 'texts.letterEyebrow', label: 'Захидлын дээд бичвэр', max: 30 },
        { type: 'text', key: 'texts.letterTitle', label: 'Захидлын гарчиг', max: 30 },
        { type: 'textarea', key: 'texts.letterBody', label: 'Захидлын бичвэр', max: 160, rows: 3 },
        { type: 'text', key: 'texts.ticket', label: 'Тасалбар дээрх үг', max: 10 },
        { type: 'text', key: 'texts.littleTitle', label: '«Жижигхэн зүйлс» гарчиг', max: 30 },
        { type: 'textarea', key: 'texts.littleNote', label: '«Жижигхэн зүйлс» тэмдэглэл', max: 140, rows: 3 },
        { type: 'text', key: 'texts.placesLabel', label: 'Газрын гарчиг', max: 40 },
        { type: 'textarea', key: 'texts.placesNote', label: 'Газрын тэмдэглэл', max: 120, rows: 2 },
        { type: 'textarea', key: 'texts.postmark', label: 'Шуудангийн тамга', max: 30, rows: 2 },
        { type: 'text', key: 'texts.notesTitle', label: 'Тэмдэглэлийн хуудасны гарчиг', max: 40 },
        { type: 'text', key: 'texts.noteOneLabel', label: '1-р тэмдэглэлийн шошго', max: 30 },
        { type: 'text', key: 'texts.noteOne', label: '1-р тэмдэглэл', max: 60 },
        { type: 'text', key: 'texts.noteTwoLabel', label: '2-р тэмдэглэлийн шошго', max: 30 },
        { type: 'text', key: 'texts.noteTwo', label: '2-р тэмдэглэл', max: 60 },
        { type: 'textarea', key: 'texts.noteThree', label: '3-р тэмдэглэл', max: 100, rows: 2 },
        { type: 'textarea', key: 'texts.finalList', label: 'Жижигхэн зүйлсийн жагсаалт', max: 200, rows: 5 },
        { type: 'text', key: 'texts.pocketTitle', label: 'Халаастай хуудасны гарчиг', max: 40 },
        { type: 'text', key: 'texts.tomorrow', label: 'Халаастай хуудасны тэмдэглэл', max: 60 },
      ],
    },
```

Replace with six sections (every field keeps its exact original `key`, `label`,
`max`, `rows`, and `type` — only the grouping changes):

```ts
    {
      id: 'lucky', title: 'Азтай', previewPage: 2,
      fields: [
        { type: 'textarea', key: 'texts.lucky', label: 'Том үг (3-р хуудас)', max: 30, rows: 2 },
        { type: 'textarea', key: 'texts.luckyNote', label: 'Тэмдэглэл (3-р хуудас)', max: 120, rows: 2 },
      ],
    },
    {
      id: 'letter', title: 'Захидал', previewPage: 3,
      fields: [
        { type: 'text', key: 'texts.letterEyebrow', label: 'Захидлын дээд бичвэр', max: 30 },
        { type: 'text', key: 'texts.letterTitle', label: 'Захидлын гарчиг', max: 30 },
        { type: 'textarea', key: 'texts.letterBody', label: 'Захидлын бичвэр', max: 160, rows: 3 },
        { type: 'text', key: 'texts.ticket', label: 'Тасалбар дээрх үг', max: 10 },
      ],
    },
    {
      id: 'little', title: 'Жижигхэн зүйлс', previewPage: 4,
      fields: [
        { type: 'text', key: 'texts.littleTitle', label: '«Жижигхэн зүйлс» гарчиг', max: 30 },
        { type: 'textarea', key: 'texts.littleNote', label: '«Жижигхэн зүйлс» тэмдэглэл', max: 140, rows: 3 },
      ],
    },
    {
      id: 'places', title: 'Газрууд', previewPage: 5,
      fields: [
        { type: 'text', key: 'texts.placesLabel', label: 'Газрын гарчиг', max: 40 },
        { type: 'textarea', key: 'texts.placesNote', label: 'Газрын тэмдэглэл', max: 120, rows: 2 },
        { type: 'textarea', key: 'texts.postmark', label: 'Шуудангийн тамга', max: 30, rows: 2 },
      ],
    },
    {
      id: 'notes', title: 'Тэмдэглэлүүд', previewPage: 6,
      fields: [
        { type: 'text', key: 'texts.notesTitle', label: 'Тэмдэглэлийн хуудасны гарчиг', max: 40 },
        { type: 'text', key: 'texts.noteOneLabel', label: '1-р тэмдэглэлийн шошго', max: 30 },
        { type: 'text', key: 'texts.noteOne', label: '1-р тэмдэглэл', max: 60 },
        { type: 'text', key: 'texts.noteTwoLabel', label: '2-р тэмдэглэлийн шошго', max: 30 },
        { type: 'text', key: 'texts.noteTwo', label: '2-р тэмдэглэл', max: 60 },
        { type: 'textarea', key: 'texts.noteThree', label: '3-р тэмдэглэл', max: 100, rows: 2 },
        { type: 'textarea', key: 'texts.finalList', label: 'Жижигхэн зүйлсийн жагсаалт', max: 200, rows: 5 },
      ],
    },
    {
      id: 'pocket', title: 'Халаастай хуудас', previewPage: 10,
      fields: [
        { type: 'text', key: 'texts.pocketTitle', label: 'Халаастай хуудасны гарчиг', max: 40 },
        { type: 'text', key: 'texts.tomorrow', label: 'Халаастай хуудасны тэмдэглэл', max: 60 },
      ],
    },
```

- [ ] **Step 2: Add `previewPage` to the three remaining sections**

In the same `schema` array, find the `basics`, `song`, and `back` sections and add
`previewPage` (keep their existing `title`/`description`/`fields` unchanged):

```ts
{ id: 'basics', title: 'Нүүр ба үндсэн', previewPage: 0, fields: [...] },
{ id: 'song', title: 'Таны дуу', previewPage: 1, fields: [...] },
{ id: 'back', title: 'Арын хавтас', previewPage: 11, fields: [...] },
```

(`photos` intentionally gets no `previewPage` — the 10-photo pool spreads across all
12 pages, so no single page represents it; the preview simply stays wherever it
currently is when that section is open.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `book`'s `View.tsx`/`Scrapbook.tsx` prop signatures
(next steps fix them). The schema restructuring itself is purely additive to the
`Section[]` array shape and introduces no type errors on its own.

- [ ] **Step 4: Thread `pin` through Book's `View.tsx`**

In `src/templates/book/View.tsx`, find:

```tsx
export default function BookView({ content }: { content: Content }) {
  const data = useMemo(() => toScrapbook(content), [content]);
  // react-pageflip can't re-render its children in place → remount when content changes
  const key = useMemo(() => JSON.stringify(data).length + ':' + hash(JSON.stringify(data)), [data]);
  return (
    <div className="dl-book-root">
      <Scrapbook key={key} data={data} />
    </div>
  );
}
```

Replace with:

```tsx
export default function BookView({ content, pin }: { content: Content; pin?: string | number | null }) {
  const data = useMemo(() => toScrapbook(content), [content]);
  // react-pageflip can't re-render its children in place → remount when content changes
  const key = useMemo(() => JSON.stringify(data).length + ':' + hash(JSON.stringify(data)), [data]);
  return (
    <div className="dl-book-root">
      <Scrapbook key={key} data={data} pin={pin} />
    </div>
  );
}
```

- [ ] **Step 5: Make `Scrapbook.tsx` honor `pin`**

In `src/templates/book/Scrapbook.tsx`, find:

```tsx
export default function Scrapbook({ data = defaults }: { data?: ScrapbookData }) {
  const book = useRef<FlipApi | null>(null);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
```

Replace with:

```tsx
export default function Scrapbook({ data = defaults, pin = null }: { data?: ScrapbookData; pin?: string | number | null }) {
  const book = useRef<FlipApi | null>(null);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [apiReady, setApiReady] = useState(false);
```

Find:

```tsx
              onInit={(e: { data: { page: number; mode: 'portrait' | 'landscape' } }) => setOrientation(e.data.mode)}
```

Replace with:

```tsx
              onInit={(e: { data: { page: number; mode: 'portrait' | 'landscape' } }) => { setOrientation(e.data.mode); setApiReady(true); }}
```

Then, right after the `openBook` function and its cleanup effect (after the line
`useEffect(() => () => window.clearTimeout(t.current), []);`), add:

```tsx
  useEffect(() => {
    if (!apiReady || typeof pin !== 'number') return;
    setIntroVisible(false);
    book.current?.pageFlip()?.flip(pin);
  }, [pin, apiReady]);
```

(`apiReady` guards against calling `pageFlip()` before `react-pageflip`'s lazy-loaded
API is ready — `onInit` is the library's own signal for that, already used to set
`orientation`. Since `BookView` remounts `Scrapbook` on every content edit,
`apiReady` resets and this effect re-fires on every remount too, which is expected
and consistent with how the other three templates behave.)

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: passes with zero errors — all six templates now typecheck clean.

- [ ] **Step 7: Manual verification**

1. Buy the Book ("Дурсамжийн ном") template, open its editor.
2. Open "Азтай" (the first of the six new sections). Confirm the preview skips the
   "Чамд зориулсан / бэлэг / нээх →" intro card entirely and shows page 3 (the lucky
   page) directly.
3. Open "Захидал", "Жижигхэн зүйлс", "Газрууд", "Тэмдэглэлүүд", "Халаастай хуудас" in
   turn. Confirm each jumps to its own distinct page.
4. Open "Нүүр ба үндсэн" (basics). Confirm it jumps to the front cover (page 1 as
   shown in the reader's page counter).
5. Open "Зургууд" (photos). Confirm the preview does **not** jump anywhere — it stays
   on whatever page it was last showing.
6. Type into a field in "Захидал" (e.g. the letter title), reload the editor page
   entirely (full browser refresh), and confirm the value you typed is still there —
   this proves the schema split didn't change any field's storage key (Review Focus
   item 3).

- [ ] **Step 8: Commit**

```bash
git add src/templates/book/meta.ts src/templates/book/View.tsx src/templates/book/Scrapbook.tsx
git commit -m "Pin editor live preview to the open section (Book)"
```

---

## Task 7: Full regression pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Full typecheck**

Run: `npm run typecheck`
Expected: passes with zero errors.

- [ ] **Step 2: Confirm the published page is unaffected**

1. Fully publish a page for any of the four in-scope templates (Wrapped, Flight,
   LoveFlix, or Book) via the editor's "Нийтлэх" flow.
2. Open the published `/p/<slug>` URL in a new tab (not the editor).
3. Confirm it behaves exactly as it did before this feature: full autoplay, no
   pinning, no "▶ Бүтнээр" button visible anywhere (that button only exists in the
   editor toolbar).

- [ ] **Step 3: Confirm the standalone template demo preview is unaffected**

1. Visit `/templates/wrapped` (or `flight`/`netflix`/`book`) while signed out or
   without buying.
2. Confirm the demo preview autoplays exactly as before — no `pin` is ever sent from
   this route (it doesn't use `Editor.tsx` or its `postMessage` at all).

- [ ] **Step 4: Confirm Quest and Locket are completely unaffected by pinning**

1. Buy the Quest ("Хайрын адал явдал") template, open its editor. Confirm the live
   preview behaves exactly as before this feature — no jumping, no change in the
   title-screen/gameplay flow.
2. Buy the Locket ("Медальон түүх") template, open its editor. Confirm the same.
3. In both editors, confirm the "Дараах →" button from Task 3 still appears and
   advances through sections normally (it's generic to every template's accordion,
   Quest/Locket included) — it just has no pinning effect on their previews, since
   neither template's `meta.ts` sets `previewPage`. This is expected, not a bug: the
   button is a sidebar-navigation convenience independent of pinning support.

- [ ] **Step 5: Final commit (if any cleanup was needed)**

If all checks pass with no further changes, this task needs no commit. If any manual
verification step above surfaced a fix, make it, re-run the relevant task's typecheck
and manual steps, then commit with a message describing exactly what was fixed.
