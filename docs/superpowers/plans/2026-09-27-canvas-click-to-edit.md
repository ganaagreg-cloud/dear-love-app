# Canvas click-to-edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the editor, clicking an element in the live preview (text, a photo, a date) opens a small popover next to that element with just the control for that field, instead of requiring the sidebar. Build the shared infrastructure once; fully convert Flight as the pilot template.

**Architecture:** A new `<Editable>` component + React context (`src/templates/Editable.tsx`) lets template internals mark a rendered element as clickable without prop-drilling. Clicking posts a new `dear:edit` message to the parent; `Editor.tsx` looks up the field in `meta.schema`, converts the reported rect to screen coordinates using the iframe's existing `scale`, and renders a popover reusing `FieldControl` (plus a new `SingleItemControl` for one array slot). The existing `dear:content` message gains an `editing` hint so a template's own list navigation (Flight's stop-by-stop journey) can re-seed its position after the remount every content edit already causes. The sidebar becomes collapsible, opt-in per template via `TemplateMeta.canvasEditable`.

**Tech Stack:** Next.js App Router, React 19, TypeScript. No test framework in this repo — verification is `npm run typecheck` plus manual browser checks, per existing project convention (`CLAUDE.md`).

**Spec:** `docs/superpowers/specs/2026-09-27-canvas-click-to-edit-design.md`

## Global Constraints

- Every save still goes through `PATCH /api/pages/[id]` → `sanitizeContent`. The popover only ever calls the same `set(key, v)`/`onChange` path `FieldControl` already uses — never a new endpoint, never a new trust boundary.
- `<Editable>` is zero-cost when edit mode is inactive: published pages (`/p/[slug]`) and the standalone demo (`/templates/[id]`) must render byte-for-byte the same DOM as before this change.
- Templates that don't opt in (`canvasEditable` unset) must keep their sidebar open by default and behave exactly as today — this plan only sets `canvasEditable` on Flight.
- No new dependencies.
- Mongolian UI copy conventions: short, terse labels matching the existing editor toolbar (`Засах`, `Харах`, `Нийтлэх`, `Бүх талбар`).
- Canvas-click editing never re-derives or changes `pin`/`open` (see spec's "Editor.tsx: the popover" section) — a field's owning schema section is not reliably the scene it's visually rendered in (Flight's `toCity` belongs to the `route` section, pinned to `board`, but is also clickable inside the `pass` scene).
- A per-slot image edit (`stopPhotos[i]`) must never remove/shift the array — it's positionally coupled to `stopNames[i]`/`stopDates[i]`/etc.

## Review Focus

- Clicking a field that's visible in a scene other than its owning section's pinned scene (e.g. `toCity` clicked while looking at the `pass` scene) must not jump the preview to `board`. (Task 1)
- Editing a stop's note/name/photo on stop 4 must not reset the Journey preview back to stop 1 after the debounced-save remount. (Task 4)
- Clearing a stop's photo via the popover must set `''` at that index, never delete/shift the array (would desync `stopPhotos[i]` from `stopNames[i]`). (Task 4)
- Non-Flight templates (five others) must render their editor with the sidebar open by default and zero hover outlines/badges anywhere in the preview — `canvasEditable` must default falsy. (Task 6)
- The popover must reposition or close itself when the underlying anchor could no longer be valid (device switch, window resize, `previewingFull` toggle) rather than floating over the wrong spot. (Task 7)

---

## Task 1: Shared `Editable` infrastructure, protocol, and popover — proven on one field

This is the full vertical slice: the context/component, both new postMessage
fields, the popover shell, and one real Flight field (`toCity`) wired end to
end. Every other task adds more fields or refines behavior on top of this.

**Files:**
- Create: `src/templates/Editable.tsx`
- Create: `src/templates/editable.css`
- Create: `src/components/editor/EditPopover.tsx`
- Modify: `src/templates/types.ts`
- Modify: `src/app/(bare)/render/[id]/RenderFrame.tsx`
- Modify: `src/templates/TemplateView.tsx`
- Modify: `src/templates/wrapped/View.tsx`
- Modify: `src/templates/netflix/View.tsx`
- Modify: `src/templates/quest/View.tsx`
- Modify: `src/templates/locket/View.tsx`
- Modify: `src/templates/book/View.tsx`
- Modify: `src/templates/flight/Flight.tsx`
- Modify: `src/components/editor/Editor.tsx`
- Modify: `src/components/editor/editor.css`

**Interfaces:**
- Produces: `Editing = { field: string; index?: number } | null` (types.ts) — consumed by `TemplateView`, every `View.tsx`, and (from Task 4 on) `Flight.tsx`.
- Produces: `EditModeProvider({ active, children })`, `useEditMode()`, `<Editable field index?>` (Editable.tsx) — consumed by every later task that wraps a field.
- Produces: `{ type: 'dear:edit', field, index?, rect }` (child→parent) and `dear:content`'s new `editing` field (parent→child) — the full protocol other tasks rely on.
- Produces: `<EditPopover field value rect onChange onClose upload />` — extended with an `index` prop in Task 3.

- [ ] **Step 1: Add the `Editing` type**

In `src/templates/types.ts`, find:

```ts
export type Content = Record<string, ContentValue>;
```

Replace with:

```ts
export type Content = Record<string, ContentValue>;

/** Which field (and, for list/images fields, which array slot) the buyer last clicked in the live preview. */
export type Editing = { field: string; index?: number } | null;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes (purely additive).

- [ ] **Step 3: Create the `Editable` component and its stylesheet**

Create `src/templates/editable.css`:

```css
.dear-editable { position: relative; cursor: pointer; }
.dear-editable:hover { outline: 2px dashed var(--rose-2); outline-offset: 2px; }
.dear-editable:hover::after {
  content: '✏️'; position: absolute; top: -10px; right: -10px;
  width: 22px; height: 22px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .25);
  font-size: 12px; line-height: 22px; text-align: center;
  pointer-events: none; z-index: 5;
}
```

Create `src/templates/Editable.tsx`:

```tsx
'use client';
import { cloneElement, createContext, isValidElement, useCallback, useContext, type ReactElement, type ReactNode } from 'react';
import './editable.css';

type EditCtx = {
  active: boolean;
  onEdit: (field: string, index: number | undefined, rect: DOMRect) => void;
};
const Ctx = createContext<EditCtx>({ active: false, onEdit: () => {} });

export function EditModeProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const onEdit = useCallback((field: string, index: number | undefined, rect: DOMRect) => {
    window.parent?.postMessage(
      { type: 'dear:edit', field, index, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } },
      window.location.origin,
    );
  }, []);
  return <Ctx.Provider value={{ active, onEdit }}>{children}</Ctx.Provider>;
}

export function useEditMode() {
  return useContext(Ctx).active;
}

/**
 * Marks a single rendered element as clickable-to-edit. Wraps its one child via
 * cloneElement (not an extra wrapper element) so existing grid/flex/absolute
 * layouts are never disturbed. Falls back to a `display: contents` span for
 * children that can't be cloned onto directly (bare text, fragments) — that
 * span has no layout footprint of its own.
 */
export function Editable({ field, index, children }: { field: string; index?: number; children: ReactElement }) {
  const { active, onEdit } = useContext(Ctx);
  if (!active) return children;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onEdit(field, index, e.currentTarget.getBoundingClientRect());
  };

  if (isValidElement(children)) {
    const props = children.props as { className?: string; onClick?: (e: React.MouseEvent<HTMLElement>) => void };
    // cloneElement's generic prop typing can't express "any host element's
    // className/onClick" — this component is a deliberately generic wrapper.
    return cloneElement(children, {
      className: [props.className, 'dear-editable'].filter(Boolean).join(' '),
      onClick: (e: React.MouseEvent<HTMLElement>) => { props.onClick?.(e); handleClick(e); },
    } as any);
  }
  return (
    <span className="dear-editable" style={{ display: 'contents' }} onClick={handleClick}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Wrap `RenderFrame` in `EditModeProvider` and thread `editing`**

Replace `src/app/(bare)/render/[id]/RenderFrame.tsx` with:

```tsx
'use client';
import { useEffect, useState } from 'react';
import TemplateView from '@/templates/TemplateView';
import { EditModeProvider } from '@/templates/Editable';
import type { Content, Editing } from '@/templates/types';

export default function RenderFrame({ templateId, initial }: { templateId: string; initial: Content }) {
  const [content, setContent] = useState<Content | null>(null);
  const [pin, setPin] = useState<string | number | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'dear:content' && e.data.content && typeof e.data.content === 'object') {
        setContent(e.data.content);
        setPin(e.data.pin ?? null);
        setEditing(e.data.editing ?? null);
      }
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'dear:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return (
    <EditModeProvider active>
      <TemplateView templateId={templateId} content={content ?? initial} pin={pin} editing={editing} editable />
    </EditModeProvider>
  );
}
```

- [ ] **Step 6: Thread `editing` through `TemplateView`**

Replace `src/templates/TemplateView.tsx` with:

```tsx
'use client';
import dynamic from 'next/dynamic';
import type { Content, Editing } from './types';

const VIEWS = {
  locket: dynamic(() => import('./locket/View'), { ssr: false }),
  book: dynamic(() => import('./book/View'), { ssr: false }),
  netflix: dynamic(() => import('./netflix/View'), { ssr: false }),
  quest: dynamic(() => import('./quest/View'), { ssr: false }),
  wrapped: dynamic(() => import('./wrapped/View'), { ssr: false }),
  flight: dynamic(() => import('./flight/View'), { ssr: false }),
} as const;

export default function TemplateView({ templateId, content, pin, editing, editable }: {
  templateId: string; content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean;
}) {
  const View = VIEWS[templateId as keyof typeof VIEWS];
  if (!View) return null;
  return <View content={content} pin={pin ?? null} editing={editing ?? null} editable={editable} />;
}
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: **fails** — all six `View.tsx` components now receive an `editing`
prop their type signature doesn't declare. Steps 8–9 fix all six (five
accept-and-ignore, Flight gets the real wiring).

- [ ] **Step 8: Accept-and-ignore `editing` in the five templates not being converted**

In `src/templates/wrapped/View.tsx`, find:

```ts
import type { Content } from '../types';
```
```ts
export default function WrappedView({ content, pin }: { content: Content; pin?: string | number | null; editable?: boolean }) {
```

Replace with:

```ts
import type { Content, Editing } from '../types';
```
```ts
export default function WrappedView({ content, pin }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
```

In `src/templates/netflix/View.tsx`, find:

```ts
import type { Content } from '../types';
```
```ts
export default function NetflixView({ content, pin }: { content: Content; pin?: string | number | null; editable?: boolean }) {
```

Replace with:

```ts
import type { Content, Editing } from '../types';
```
```ts
export default function NetflixView({ content, pin }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
```

In `src/templates/quest/View.tsx`, find:

```ts
import type { Content } from '../types';
```
```ts
export default function QuestView({ content }: { content: Content; pin?: string | number | null; editable?: boolean }) {
```

Replace with:

```ts
import type { Content, Editing } from '../types';
```
```ts
export default function QuestView({ content }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
```

In `src/templates/locket/View.tsx`, find:

```ts
import type { Content } from '../types';
```
```ts
export default function LocketView({ content }: { content: Content; pin?: string | number | null; editable?: boolean }) {
```

Replace with:

```ts
import type { Content, Editing } from '../types';
```
```ts
export default function LocketView({ content }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
```

In `src/templates/book/View.tsx`, find:

```ts
import type { Content } from '../types';
```
```ts
export default function BookView({ content, pin, editable }: { content: Content; pin?: string | number | null; editable?: boolean }) {
```

Replace with:

```ts
import type { Content, Editing } from '../types';
```
```ts
export default function BookView({ content, pin, editable }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on `flight/View.tsx` (next step fixes it).

- [ ] **Step 10: Accept `editing` in Flight's `View.tsx`**

In `src/templates/flight/View.tsx`, find:

```tsx
import type { Content } from '../types';
```
```tsx
export default function FlightView({ content, pin }: { content: Content; pin?: string | number | null; editable?: boolean }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} pin={pin} />;
}
```

Replace with:

```tsx
import type { Content, Editing } from '../types';
```
```tsx
export default function FlightView({ content, pin }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} pin={pin} />;
}
```

(`editing` is accepted but not yet passed to `<Flight>` — that connection is
made in Task 4, once `Flight.tsx` has a use for it. Wrapping fields with
`<Editable>` in this and the next two tasks doesn't need it: `Editable` reads
edit-mode from context, not from this prop.)

- [ ] **Step 11: Typecheck**

Run: `npm run typecheck`
Expected: passes with zero errors — all six templates typecheck clean again.

- [ ] **Step 12: Wrap Flight's `toCity` in `<Editable>`**

In `src/templates/flight/Flight.tsx`, find:

```tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
```

Replace with:

```tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Editable } from '../Editable';
```

Find:

```tsx
                <div className="r"><b>{data.toCode}</b><small>{data.toCity}</small></div>
```

Replace with:

```tsx
                <div className="r"><b>{data.toCode}</b><Editable field="toCity"><small>{data.toCity}</small></Editable></div>
```

- [ ] **Step 13: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 14: Create `EditPopover`**

Create `src/components/editor/EditPopover.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import type { ContentValue, Field } from '@/templates/types';
import { FieldControl, type Uploader } from './Fields';

export type ScreenRect = { top: number; left: number; width: number; height: number };

export function EditPopover({ field, value, rect, onChange, onClose, upload }: {
  field: Field;
  value: ContentValue | undefined;
  rect: ScreenRect;
  onChange: (v: ContentValue) => void;
  onClose: () => void;
  upload: Uploader;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const width = 300;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const top = Math.min(Math.max(12, rect.top + rect.height + 8), window.innerHeight - 220);

  return (
    <div className="ed-pop-backdrop" onClick={onClose}>
      <div className="ed-pop" style={{ left, top, width }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ed-pop-close" onClick={onClose} aria-label="Хаах">✕</button>
        <FieldControl field={field} value={value} onChange={onChange} upload={upload} />
      </div>
    </div>
  );
}
```

- [ ] **Step 15: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 16: Add popover styles to `editor.css`**

In `src/components/editor/editor.css`, at the end of the file, add:

```css
.ed-pop-backdrop { position: fixed; inset: 0; z-index: 40; }
.ed-pop { position: fixed; z-index: 41; background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 20px 50px -12px rgba(60, 20, 50, .35); padding: 16px 14px 10px; }
.ed-pop-close { position: absolute; top: 6px; right: 8px; border: 0; background: transparent; font-size: .9rem; color: var(--ink-3); line-height: 1; padding: 4px; cursor: pointer; }
```

- [ ] **Step 17: Wire the `dear:edit` listener, `editing` posting, and the popover into `Editor.tsx`**

In `src/components/editor/Editor.tsx`, find:

```ts
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
```

Replace with:

```ts
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
```

Find:

```ts
import type { Content, ContentValue, TemplateMeta } from '@/templates/types';
import { FieldControl } from './Fields';
import { uploadMedia } from '@/lib/upload';
```

Replace with:

```ts
import { allFields } from '@/templates/types';
import type { Content, ContentValue, Editing, TemplateMeta } from '@/templates/types';
import { FieldControl } from './Fields';
import { EditPopover, type ScreenRect } from './EditPopover';
import { uploadMedia } from '@/lib/upload';
```

Find:

```ts
  const post = useCallback(
    () => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current, pin }, window.location.origin),
    [pin],
  );
```

Replace with:

```ts
  const [editTarget, setEditTarget] = useState<{ field: string; index?: number; rect: ScreenRect } | null>(null);
  // Memoized (not a plain `const`, unlike `pin`): `pin` is a primitive, so recomputing it
  // every render is fine, but `editing` is an object — a plain recomputation would create a
  // new reference every render even when nothing changed, breaking `post`'s useCallback
  // memoization below and resetting the 700ms debounce on every unrelated re-render.
  const editTargetField = editTarget?.field;
  const editTargetIndex = editTarget?.index;
  const editing: Editing = useMemo(
    () => (editTargetField ? { field: editTargetField, index: editTargetIndex } : null),
    [editTargetField, editTargetIndex],
  );
  const post = useCallback(
    () => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current, pin, editing }, window.location.origin),
    [pin, editing],
  );
```

Find:

```ts
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === 'dear:ready') post(); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [post]);
```

Replace with:

```ts
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === 'dear:ready') post(); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [post]);
  /* ── canvas click-to-edit: a field wrapped in <Editable> was clicked inside
     the preview. This never touches `open`/`pin` — see Global Constraints. ── */
  useEffect(() => {
    const onEdit = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'dear:edit') return;
      const { field, index, rect } = e.data as { field: string; index?: number; rect: ScreenRect };
      if (!allFields(meta).some((f) => f.key === field)) return;
      setEditTarget({ field, index, rect });
    };
    window.addEventListener('message', onEdit);
    return () => window.removeEventListener('message', onEdit);
  }, [meta]);
```

Find (the coordinate-scaling section, right before the JSX `return`):

```ts
  const d = DEVICES[device];
  const saveLabel = { saved: 'Бүгд хадгалагдсан', dirty: 'Хадгалаагүй өөрчлөлт…', saving: 'Хадгалж байна…', error: 'Хадгалж чадсангүй — дараагийн засвараар дахин оролдоно' }[save];
```

Replace with:

```ts
  const d = DEVICES[device];
  const saveLabel = { saved: 'Бүгд хадгалагдсан', dirty: 'Хадгалаагүй өөрчлөлт…', saving: 'Хадгалж байна…', error: 'Хадгалж чадсангүй — дараагийн засвараар дахин оролдоно' }[save];

  const editField = editTarget ? allFields(meta).find((f) => f.key === editTarget.field) : undefined;
  const screenRect: ScreenRect | null = editTarget && frame.current
    ? (() => {
        const ir = frame.current!.getBoundingClientRect();
        return { top: ir.top + editTarget.rect.top * scale, left: ir.left + editTarget.rect.left * scale, width: editTarget.rect.width * scale, height: editTarget.rect.height * scale };
      })()
    : null;
```

Find the closing of the component, just before the final `</div>` that ends
`.ed`:

```tsx
      {share && slug && (
```

Replace with:

```tsx
      {editTarget && editField && screenRect && (
        <EditPopover
          field={editField}
          value={content[editField.key]}
          rect={screenRect}
          onChange={(v) => set(editField.key, v)}
          onClose={() => setEditTarget(null)}
          upload={upload}
        />
      )}

      {share && slug && (
```

- [ ] **Step 18: Typecheck**

Run: `npm run typecheck`
Expected: passes with zero errors.

- [ ] **Step 19: Manual verification**

1. Run `npm run dev` in demo mode (no Supabase env vars), sign in via demo
   login, buy the Flight ("Хайрын нислэг") template, open its editor.
2. Open the "Тасалбар" section in the sidebar (pins the preview to the `pass`
   scene). Hover the destination city text on the boarding pass's route line
   (`data.toCity`): confirm a dashed outline and a ✏️ badge appear, and the
   cursor becomes a pointer.
3. Click it. Confirm a popover opens next to it with a single text input
   pre-filled with the current city name, and the sidebar's open section
   does **not** change (still "Тасалбар" — this is the Review Focus item:
   `toCity` belongs to the `route` section, but clicking it must not jump the
   preview to the `board` scene).
4. Type a new city name in the popover. Confirm the preview updates live and
   the existing "Хадгалж байна…" save indicator fires exactly as it does for
   sidebar edits.
5. Press Escape, and separately, click outside the popover: confirm both
   close it.
6. Confirm `/p/[slug]` (any published page) and `/templates/flight` show no
   outline/badge on hover anywhere, and clicking does nothing — edit mode is
   inactive there.
7. Open the editor for any other template (e.g. Wrapped) and confirm it's
   completely unaffected — sidebar open, no hover effects anywhere in its
   preview.

- [ ] **Step 20: Commit**

```bash
git add src/templates/Editable.tsx src/templates/editable.css src/templates/types.ts "src/app/(bare)/render/[id]/RenderFrame.tsx" src/templates/TemplateView.tsx src/templates/wrapped/View.tsx src/templates/netflix/View.tsx src/templates/quest/View.tsx src/templates/locket/View.tsx src/templates/book/View.tsx src/templates/flight/View.tsx src/templates/flight/Flight.tsx src/components/editor/EditPopover.tsx src/components/editor/Editor.tsx src/components/editor/editor.css
git commit -m "Add canvas click-to-edit infrastructure, proven on Flight's toCity"
```

---

## Task 2: Wrap Flight's remaining scalar fields

**Files:**
- Modify: `src/templates/flight/Flight.tsx`

**Interfaces:**
- Consumes: `<Editable field index?>` from Task 1. No index used in this task (all scalar fields).
- Produces: nothing new — same infrastructure, more coverage.

- [ ] **Step 1: Wrap the route line's remaining three fields (pass scene)**

In `src/templates/flight/Flight.tsx`, find:

```tsx
              <div className="fl-route">
                <div><b>{data.fromCode}</b><small>{data.fromCity}</small></div>
                <div className="fl-plane"><i />✈<i /></div>
                <div className="r"><b>{data.toCode}</b><Editable field="toCity"><small>{data.toCity}</small></Editable></div>
              </div>
```

Replace with:

```tsx
              <div className="fl-route">
                <div><Editable field="fromCode"><b>{data.fromCode}</b></Editable><Editable field="fromCity"><small>{data.fromCity}</small></Editable></div>
                <div className="fl-plane"><i />✈<i /></div>
                <div className="r"><Editable field="toCode"><b>{data.toCode}</b></Editable><Editable field="toCity"><small>{data.toCity}</small></Editable></div>
              </div>
```

- [ ] **Step 2: Wrap the ticket header and fields grid (pass scene)**

Find:

```tsx
              <header className="fl-head">
                <span className="fl-logo">✈︎ {data.airline}</span>
                <span className="fl-class">{data.cabin}</span>
              </header>
```

Replace with:

```tsx
              <header className="fl-head">
                <Editable field="airline"><span className="fl-logo">✈︎ {data.airline}</span></Editable>
                <Editable field="cabin"><span className="fl-class">{data.cabin}</span></Editable>
              </header>
```

Find:

```tsx
              <div className="fl-fields">
                <div><small>Зорчигч</small><strong>{data.passenger}</strong></div>
                <div><small>Нислэг</small><strong>{data.flightNo}</strong></div>
                <div><small>Огноо</small><strong>{data.date}</strong></div>
                <div><small>Суух цаг</small><strong>{data.boarding}</strong></div>
                <div><small>Хаалга</small><strong>{data.gate}</strong></div>
                <div><small>Суудал</small><strong>{data.seat}</strong></div>
              </div>
              <p className="fl-captain">Жолоодох нисгэгч: <b>{data.captain}</b></p>
```

Replace with:

```tsx
              <div className="fl-fields">
                <div><small>Зорчигч</small><Editable field="passenger"><strong>{data.passenger}</strong></Editable></div>
                <div><small>Нислэг</small><Editable field="flightNo"><strong>{data.flightNo}</strong></Editable></div>
                <div><small>Огноо</small><Editable field="date"><strong>{data.date}</strong></Editable></div>
                <div><small>Суух цаг</small><Editable field="boarding"><strong>{data.boarding}</strong></Editable></div>
                <div><small>Хаалга</small><Editable field="gate"><strong>{data.gate}</strong></Editable></div>
                <div><small>Суудал</small><Editable field="seat"><strong>{data.seat}</strong></Editable></div>
              </div>
              <p className="fl-captain">Жолоодох нисгэгч: <Editable field="captain"><b>{data.captain}</b></Editable></p>
```

- [ ] **Step 3: Wrap the landing scene's title and message**

Find:

```tsx
            <h1>{data.finalTitle}</h1>
            <p>{data.finalMessage}</p>
```

Replace with:

```tsx
            <Editable field="finalTitle"><h1>{data.finalTitle}</h1></Editable>
            <Editable field="finalMessage"><p>{data.finalMessage}</p></Editable>
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Manual verification**

1. In Flight's editor, open the "Тасалбар" section (pins to `pass`). Click
   each of: airline logo text, class text, passenger/flightNo/date/boarding/
   gate/seat in the fields grid, and the captain's name. Confirm each opens a
   popover for the correct field (matching the label it would have in the
   sidebar) and edits save live.
2. Click the route line's `fromCode`/`fromCity`/`toCode` (in addition to
   `toCity` from Task 1). Confirm each works the same way.
3. Open "Газардалт" (pins to `land`). Click the passport stamp's title and
   message paragraph. Confirm both are editable via popover — note the
   message field is a `textarea` (500 chars), so the popover should show a
   multi-line box, not a single-line input (this comes for free from
   `FieldControl`'s existing `textarea` case).
4. Confirm `color` and `music` (ticket color swatch, landing music upload)
   still have no on-canvas anchor — they're not wrapped in this task,
   intentionally (per spec, sidebar-only).

- [ ] **Step 6: Commit**

```bash
git add src/templates/flight/Flight.tsx
git commit -m "Wrap Flight's remaining scalar fields in <Editable>"
```

---

## Task 3: Wrap the departures board and call-announcement fields

The `board` scene's "me" row and call-out line show some of the same fields
(`toCity`, `flightNo`, `boarding`, `gate`, `passenger`) as separate, independently
clickable instances — useful since a buyer may be looking at the board scene,
not the pass scene, when they want to fix one of these.

**Files:**
- Modify: `src/templates/flight/Flight.tsx`

**Interfaces:**
- Consumes: `<Editable>` from Task 1. No new exports.

- [ ] **Step 1: Wrap the call-announcement line**

Find:

```tsx
      <p className="fl-board-call">Зорчигч <b>{data.passenger}</b> та {data.gate}-р хаалга руу явна уу.</p>
```

Replace with:

```tsx
      <p className="fl-board-call">Зорчигч <Editable field="passenger"><b>{data.passenger}</b></Editable> та <Editable field="gate"><b>{data.gate}</b></Editable>-р хаалга руу явна уу.</p>
```

(`data.gate` had no wrapping element before — `<b>` is added purely so
`Editable` has a cloneable anchor; it renders visually identical to the
surrounding text since `<b>` here isn't distinguished by any CSS rule beyond
default bold, matching how `data.passenger` is already bolded right next to it.)

- [ ] **Step 2: Wrap the "me" row's flap cells**

Find:

```tsx
function DepartureBoard({ data, onSkip }: { data: FlightData; onSkip: () => void }) {
  const rows = [
    { t: '08:15', f: 'LV 101', to: 'ХААНА Ч БИШ', s: 'ЦУЦЛАВ' },
    { t: data.boarding.slice(0, 5), f: data.flightNo, to: data.toCity, s: 'СУУЖ БАЙНА', me: true },
    { t: '11:40', f: 'LV 404', to: 'ГАНЦААРАА', s: 'ЦУЦЛАВ' },
  ];
  return (
    <div className="fl-board" onClick={onSkip}>
      <div className="fl-board-head"><span>✈︎ ХӨӨРӨХ</span><Clock /></div>
      <div className="fl-board-table">
        <div className="fl-board-row th"><span>ЦАГ</span><span>НИСЛЭГ</span><span>ЧИГЛЭЛ</span><span>ТӨЛӨВ</span></div>
        {rows.map((r, i) => (
          <div className={`fl-board-row ${r.me ? 'me' : ''}`} key={i}>
            <Flap text={r.t} len={5} delay={i * 220} />
            <Flap text={r.f} len={7} delay={i * 220 + 120} />
            <Flap text={r.to} len={12} delay={i * 220 + 240} />
            <Flap text={r.s} len={10} delay={i * 220 + 360} />
          </div>
        ))}
      </div>
      <p className="fl-board-call">Зорчигч <Editable field="passenger"><b>{data.passenger}</b></Editable> та <Editable field="gate"><b>{data.gate}</b></Editable>-р хаалга руу явна уу.</p>
    </div>
  );
}
```

Replace with:

```tsx
function DepartureBoard({ data, onSkip }: { data: FlightData; onSkip: () => void }) {
  const rows = [
    { t: '08:15', f: 'LV 101', to: 'ХААНА Ч БИШ', s: 'ЦУЦЛАВ', me: false },
    { t: data.boarding.slice(0, 5), f: data.flightNo, to: data.toCity, s: 'СУУЖ БАЙНА', me: true },
    { t: '11:40', f: 'LV 404', to: 'ГАНЦААРАА', s: 'ЦУЦЛАВ', me: false },
  ];
  return (
    <div className="fl-board" onClick={onSkip}>
      <div className="fl-board-head"><span>✈︎ ХӨӨРӨХ</span><Clock /></div>
      <div className="fl-board-table">
        <div className="fl-board-row th"><span>ЦАГ</span><span>НИСЛЭГ</span><span>ЧИГЛЭЛ</span><span>ТӨЛӨВ</span></div>
        {rows.map((r, i) => (
          <div className={`fl-board-row ${r.me ? 'me' : ''}`} key={i}>
            {r.me ? <Editable field="boarding"><span><Flap text={r.t} len={5} delay={i * 220} /></span></Editable> : <Flap text={r.t} len={5} delay={i * 220} />}
            {r.me ? <Editable field="flightNo"><span><Flap text={r.f} len={7} delay={i * 220 + 120} /></span></Editable> : <Flap text={r.f} len={7} delay={i * 220 + 120} />}
            {r.me ? <Editable field="toCity"><span><Flap text={r.to} len={12} delay={i * 220 + 240} /></span></Editable> : <Flap text={r.to} len={12} delay={i * 220 + 240} />}
            <Flap text={r.s} len={10} delay={i * 220 + 360} />
          </div>
        ))}
      </div>
      <p className="fl-board-call">Зорчигч <Editable field="passenger"><b>{data.passenger}</b></Editable> та <Editable field="gate"><b>{data.gate}</b></Editable>-р хаалга руу явна уу.</p>
    </div>
  );
}
```

(`Flap` itself renders a `<span className="fl-flap">`, but `Editable` needs
its *own* single child to clone onto — wrapping `<Flap .../>` in a bare
`<span>` gives it exactly that, and `fl-flap`'s own styling is untouched
since it's on the inner span, not the one `Editable` adds its hover class to.
The two cancelled decoy rows (`me: false`) are never wrapped — they're not
real data, nothing to edit.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 4: Manual verification**

1. Open Flight's editor, open "Хаанаас → Хаашаа" (pins to `board`). Confirm
   the "me" row's time, flight number, and destination cells each show a
   hover outline and open the correct field's popover on click — including
   while the split-flap animation is still cycling (clicking mid-animation
   should still register; full animation-skip-in-edit-mode is Task 5).
2. Confirm the two decoy rows (cancelled flights) show no hover effect and
   aren't clickable.
3. Confirm the call-announcement line's passenger name and gate number are
   independently clickable and edit the same underlying fields as their
   `pass`-scene counterparts (edit one, confirm the other updates too, since
   both point at the same content key).

- [ ] **Step 5: Commit**

```bash
git add src/templates/flight/Flight.tsx
git commit -m "Wrap Flight's departures-board fields in <Editable>"
```

---

## Task 4: Per-stop editing — `SingleItemControl`, postcard fields, and the `editing` index hint

This is the task the Review Focus item about stop 4 belongs to: editing a
stop's field must not reset the Journey preview back to stop 1.

**Files:**
- Modify: `src/components/editor/Fields.tsx`
- Modify: `src/components/editor/EditPopover.tsx`
- Modify: `src/components/editor/Editor.tsx`
- Modify: `src/templates/flight/View.tsx`
- Modify: `src/templates/flight/Flight.tsx`

**Interfaces:**
- Produces: `SingleItemControl({ field, index, value, onChange, upload })` (Fields.tsx) — consumed by `EditPopover`.
- Consumes: `Editing` type from Task 1.
- Produces: `Flight`'s `editing` prop is now actually read (was accepted-and-ignored via `View.tsx` since Task 1).

- [ ] **Step 1: Add `SingleItemControl` to `Fields.tsx`**

In `src/components/editor/Fields.tsx`, find:

```ts
function useUpload(upload: Uploader) {
```

Replace with:

```ts
/** Edits exactly one array slot of a `list`/`images` field — never inserts or removes a slot. */
export function SingleItemControl({ field: f, index, value, onChange, upload }: {
  field: Field; index: number; value: ContentValue | undefined; onChange: (v: ContentValue) => void; upload: Uploader;
}) {
  if (f.type === 'list') {
    const arr = asArr(value);
    const current = arr[index] ?? '';
    return (
      <input
        className="ed-input"
        value={current}
        maxLength={f.max}
        placeholder={`${f.itemLabel ?? 'Мөр'} ${index + 1}`}
        onChange={(e) => {
          const next = [...arr];
          while (next.length <= index) next.push('');
          next[index] = e.target.value;
          onChange(next);
        }}
      />
    );
  }
  if (f.type === 'images') {
    const arr = asArr(value);
    const url = arr[index] ?? '';
    const setAt = (u: string) => {
      const next = [...arr];
      while (next.length <= index) next.push('');
      next[index] = u;
      onChange(next);
    };
    return <ImageSlot url={url} onChange={setAt} upload={upload} />;
  }
  return <FieldControl field={f} value={value} onChange={onChange} upload={upload} />;
}

function useUpload(upload: Uploader) {
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes (`SingleItemControl` is exported but not yet imported anywhere).

- [ ] **Step 3: Wire `index` through `EditPopover`**

Replace `src/components/editor/EditPopover.tsx` with:

```tsx
'use client';
import { useEffect } from 'react';
import type { ContentValue, Field } from '@/templates/types';
import { FieldControl, SingleItemControl, type Uploader } from './Fields';

export type ScreenRect = { top: number; left: number; width: number; height: number };

export function EditPopover({ field, index, value, rect, onChange, onClose, upload }: {
  field: Field;
  index?: number;
  value: ContentValue | undefined;
  rect: ScreenRect;
  onChange: (v: ContentValue) => void;
  onClose: () => void;
  upload: Uploader;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const width = 300;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const top = Math.min(Math.max(12, rect.top + rect.height + 8), window.innerHeight - 220);

  return (
    <div className="ed-pop-backdrop" onClick={onClose}>
      <div className="ed-pop" style={{ left, top, width }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ed-pop-close" onClick={onClose} aria-label="Хаах">✕</button>
        {typeof index === 'number' && (field.type === 'list' || field.type === 'images')
          ? <SingleItemControl field={field} index={index} value={value} onChange={onChange} upload={upload} />
          : <FieldControl field={field} value={value} onChange={onChange} upload={upload} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Pass `index` from `Editor.tsx`**

In `src/components/editor/Editor.tsx`, find:

```tsx
        <EditPopover
          field={editField}
          value={content[editField.key]}
          rect={screenRect}
          onChange={(v) => set(editField.key, v)}
          onClose={() => setEditTarget(null)}
          upload={upload}
        />
```

Replace with:

```tsx
        <EditPopover
          field={editField}
          index={editTarget.index}
          value={content[editField.key]}
          rect={screenRect}
          onChange={(v) => set(editField.key, v)}
          onClose={() => setEditTarget(null)}
          upload={upload}
        />
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 6: Thread `editing` all the way into `Flight.tsx`**

In `src/templates/flight/View.tsx`, find:

```tsx
export default function FlightView({ content, pin }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} pin={pin} />;
}
```

Replace with:

```tsx
export default function FlightView({ content, pin, editing }: { content: Content; pin?: string | number | null; editing?: Editing; editable?: boolean }) {
  const data = useMemo(() => toFlight(content), [content]);
  return <Flight key={JSON.stringify(data).length} data={data} pin={pin} editing={editing} />;
}
```

In `src/templates/flight/Flight.tsx`, find:

```tsx
export default function Flight({ data, pin }: { data: FlightData; pin?: string | number | null }) {
```

Replace with:

```tsx
export default function Flight({ data, pin, editing }: { data: FlightData; pin?: string | number | null; editing?: Editing }) {
```

Add a new import line — Flight.tsx has no import from `../types` yet (Task 1
only added the `Editable` import, which stays as-is). Find:

```tsx
import { Editable } from '../Editable';
```

Replace with:

```tsx
import { Editable } from '../Editable';
import type { Editing } from '../types';
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: passes (`editing` accepted but not yet read past the prop, no unused-variable error since `noUnusedParameters` isn't set in `tsconfig.json`).

- [ ] **Step 8: Seed `Journey`'s initial stop from `editing`, and wrap the postcard's fields**

In `src/templates/flight/Flight.tsx`, find:

```tsx
      {scene === 'fly' && <Journey data={data} stops={stops} pts={pts} d={d} onLand={() => setScene('land')} />}
```

Replace with:

```tsx
      {scene === 'fly' && <Journey data={data} stops={stops} pts={pts} d={d} editing={editing} onLand={() => setScene('land')} />}
```

Find:

```tsx
function Journey({ data, stops, pts, d, onLand }: { data: FlightData; stops: Stop[]; pts: [number, number][]; d: string; onLand: () => void }) {
  const path = useRef<SVGPathElement>(null);
  const [leg, setLeg] = useState(0);            // flying towards pts[leg+1]
  const [atStop, setAtStop] = useState<number | null>(null);
  const [plane, setPlane] = useState({ x: pts[0][0], y: pts[0][1], a: 0 });
```

Replace with:

```tsx
const stopFields = new Set(['stopNames', 'stopCodes', 'stopDates', 'stopNotes', 'stopPhotos']);
function seededStop(editing: Editing | undefined, stopCount: number): number | null {
  if (!editing || !stopFields.has(editing.field) || typeof editing.index !== 'number') return null;
  return Math.max(0, Math.min(editing.index, stopCount - 1));
}

function Journey({ data, stops, pts, d, editing, onLand }: { data: FlightData; stops: Stop[]; pts: [number, number][]; d: string; editing?: Editing; onLand: () => void }) {
  const path = useRef<SVGPathElement>(null);
  const seeded = seededStop(editing, stops.length);
  const [leg, setLeg] = useState(seeded ?? 0);   // flying towards pts[leg+1]
  const [atStop, setAtStop] = useState<number | null>(seeded);
  const [plane, setPlane] = useState({ x: pts[Math.max(0, seeded ?? 0)][0], y: pts[Math.max(0, seeded ?? 0)][1], a: 0 });
```

(This only covers the *initial* mount of `Journey` — sufficient, because
`FlightView`'s `key={JSON.stringify(data).length}` already remounts the whole
`Flight` tree, and therefore a fresh `Journey`, on every content edit. Editing
stop 4's note re-mounts with `editing = { field: 'stopNotes', index: 3 }`
still in the postMessage payload — see `Editor.tsx`'s `editTarget` state,
which `Editor.tsx` doesn't clear on a content change — so `seededStop` returns
`3` again on the very next remount, keeping the Journey on stop 4 instead of
resetting to stop 0.)

Now wrap the postcard's fields. Find:

```tsx
      {s && (
        <div className="fl-postcard-wrap">
          <div className="fl-postcard" key={atStop}>
            <div className="fl-pc-photo">{s.photo ? <PhotoImg src={s.photo} alt={s.name} /> : <span>♥</span>}</div>
            <div className="fl-pc-body">
              <div className="fl-pc-stamp">{(s.code || s.name.slice(0, 3)).toUpperCase()}</div>
              <small>{atStop! + 1}-р буудал · {s.date}</small>
              <h2>{s.name}</h2>
              <p>{s.note}</p>
              <button className="fl-btn sm" onClick={next}>{atStop! + 1 === stops.length ? 'Газардахаар ✈︎' : 'Нислэгээ үргэлжлүүлэх ✈︎'}</button>
            </div>
          </div>
        </div>
      )}
```

Replace with:

```tsx
      {s && (
        <div className="fl-postcard-wrap">
          <div className="fl-postcard" key={atStop}>
            <Editable field="stopPhotos" index={atStop!}>
              <div className="fl-pc-photo">{s.photo ? <PhotoImg src={s.photo} alt={s.name} /> : <span>♥</span>}</div>
            </Editable>
            <div className="fl-pc-body">
              <Editable field="stopCodes" index={atStop!}><div className="fl-pc-stamp">{(s.code || s.name.slice(0, 3)).toUpperCase()}</div></Editable>
              <small>{atStop! + 1}-р буудал · <Editable field="stopDates" index={atStop!}><span>{s.date}</span></Editable></small>
              <Editable field="stopNames" index={atStop!}><h2>{s.name}</h2></Editable>
              <Editable field="stopNotes" index={atStop!}><p>{s.note}</p></Editable>
              <button className="fl-btn sm" onClick={next}>{atStop! + 1 === stops.length ? 'Газардахаар ✈︎' : 'Нислэгээ үргэлжлүүлэх ✈︎'}</button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 10: Manual verification**

1. Open Flight's editor, open "Замын буудлууд" (pins to `fly`). Click
   "Нислэгээ үргэлжлүүлэх ✈︎" until you reach stop 4 (of however many have
   names filled in from the defaults — 5 by default).
2. Click stop 4's name (`h2`). Confirm a popover opens with a single text
   input containing just that stop's name (not the full 6-item list editor).
   Type a change. Confirm the preview's `h2` updates live, **and stays on
   stop 4** through the debounced-save remount (Review Focus item — this is
   the core fix).
3. Click stop 4's photo. Confirm the popover shows a single image slot
   (upload/replace/remove-to-empty), and uploading a photo updates just
   `stopPhotos[3]` — confirm stop 3's and stop 5's photos are untouched.
4. Click the photo's "Устгах" (remove) inside the popover (if present in
   `ImageSlot`'s existing UI) or clear the field: confirm `stopPhotos[3]`
   becomes `''` and the postcard falls back to the ♥ placeholder — and that
   `stopNames[3]`/`stopDates[3]`/etc. are unaffected (array not shifted).
5. Click stop 4's date and 3-letter code (stamp). Confirm each opens its own
   single-item popover.
6. Navigate back to stop 1 (via repeatedly clicking "Continue" wraps around,
   or reload the editor) and confirm editing stop 1's fields still works and
   doesn't affect stop 4's saved values.

- [ ] **Step 11: Commit**

```bash
git add src/components/editor/Fields.tsx src/components/editor/EditPopover.tsx src/components/editor/Editor.tsx src/templates/flight/View.tsx src/templates/flight/Flight.tsx
git commit -m "Add per-stop editing with position-preserving remounts (Flight)"
```

---

## Task 5: Edit-mode animation handling — instant Flap text, instant Journey legs, Prev button

**Files:**
- Modify: `src/templates/flight/Flight.tsx`

**Interfaces:**
- Consumes: `useEditMode()` from Task 1.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Skip `Flap`'s char-cycling animation in edit mode**

In `src/templates/flight/Flight.tsx`, find:

```tsx
function Flap({ text, delay = 0, len }: { text: string; delay?: number; len?: number }) {
  const target = (text.toUpperCase() + ' '.repeat(len ?? 0)).slice(0, len ?? text.length);
  const [shown, setShown] = useState(() => ' '.repeat(target.length));
  useEffect(() => {
    let frame = 0; const start = performance.now() + delay; let raf = 0;
    const tick = (t: number) => {
      if (t < start) { raf = requestAnimationFrame(tick); return; }
      frame++;
      const done = Math.floor((t - start) / 45);
      setShown([...target].map((ch, i) => (i < done - 6 ? ch : ch === ' ' && i < done ? ' ' : FLAP[(frame * 7 + i * 13) % FLAP.length])).join(''));
      if (done - 6 < target.length) raf = requestAnimationFrame(tick);
      else setShown(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  return <span className="fl-flap">{[...shown].map((c, i) => <i key={i}>{c === ' ' ? ' ' : c}</i>)}</span>;
}
```

Replace with:

```tsx
function Flap({ text, delay = 0, len }: { text: string; delay?: number; len?: number }) {
  const target = (text.toUpperCase() + ' '.repeat(len ?? 0)).slice(0, len ?? text.length);
  const editing = useEditMode();
  const [shown, setShown] = useState(() => (editing ? target : ' '.repeat(target.length)));
  useEffect(() => {
    if (editing) { setShown(target); return; }
    let frame = 0; const start = performance.now() + delay; let raf = 0;
    const tick = (t: number) => {
      if (t < start) { raf = requestAnimationFrame(tick); return; }
      frame++;
      const done = Math.floor((t - start) / 45);
      setShown([...target].map((ch, i) => (i < done - 6 ? ch : ch === ' ' && i < done ? ' ' : FLAP[(frame * 7 + i * 13) % FLAP.length])).join(''));
      if (done - 6 < target.length) raf = requestAnimationFrame(tick);
      else setShown(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, editing]);
  return <span className="fl-flap">{[...shown].map((c, i) => <i key={i}>{c === ' ' ? ' ' : c}</i>)}</span>;
}
```

Find (the `Editable` import from Task 1 — the `Editing` type import added in
Task 4 stays untouched, right below this line):

```tsx
import { Editable } from '../Editable';
```

Replace with:

```tsx
import { Editable, useEditMode } from '../Editable';
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Make `Journey`'s leg transitions instant in edit mode, and add a Prev button**

Find:

```tsx
  const next = () => { setAtStop(null); setLeg((l) => l + 1); };
```

Replace with:

```tsx
  const editing2 = useEditMode();
  const next = () => { setAtStop(null); setLeg((l) => l + 1); };
  const prev = () => { setAtStop(null); setLeg((l) => Math.max(0, l - 1)); };
```

(Named `editing2` to avoid clashing with the `editing?: Editing` prop already
destructured on this same component from Task 4.)

Find the animation effect:

```tsx
  // fly one leg
  useEffect(() => {
    if (atStop !== null) return;
    const p = path.current; if (!p || !lens.current.length) { const t = setTimeout(() => setLeg((l) => l), 50); return () => clearTimeout(t); }
    const from = lens.current[leg], to = lens.current[leg + 1];
    if (to === undefined) return;
    const dur = Math.max(1800, (to - from) * 4.2);
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const L = from + (to - from) * e;
      const q = p.getPointAtLength(L), q2 = p.getPointAtLength(Math.min(L + 2, to));
      setPlane({ x: q.x, y: q.y, a: Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI });
      setDrawn(L);
      if (k < 1) raf = requestAnimationFrame(tick);
      else if (leg + 1 === pts.length - 1) setTimeout(onLand, 900);
      else setAtStop(leg);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [leg, atStop, pts.length, onLand]);
```

Replace with:

```tsx
  // fly one leg — instant cut in edit mode, so clicking Prev/Continue while
  // editing a stop doesn't force sitting through a multi-second animation
  // (and re-triggering it after every debounced content-save remount).
  useEffect(() => {
    if (atStop !== null) return;
    const p = path.current; if (!p || !lens.current.length) { const t = setTimeout(() => setLeg((l) => l), 50); return () => clearTimeout(t); }
    const from = lens.current[leg], to = lens.current[leg + 1];
    if (to === undefined) return;
    if (editing2) {
      const q = p.getPointAtLength(to), q2 = p.getPointAtLength(Math.max(0, to - 2));
      setPlane({ x: q.x, y: q.y, a: Math.atan2(q.y - q2.y, q.x - q2.x) * 180 / Math.PI });
      setDrawn(to);
      if (leg + 1 === pts.length - 1) onLand(); else setAtStop(leg);
      return;
    }
    const dur = Math.max(1800, (to - from) * 4.2);
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const L = from + (to - from) * e;
      const q = p.getPointAtLength(L), q2 = p.getPointAtLength(Math.min(L + 2, to));
      setPlane({ x: q.x, y: q.y, a: Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI });
      setDrawn(L);
      if (k < 1) raf = requestAnimationFrame(tick);
      else if (leg + 1 === pts.length - 1) setTimeout(onLand, 900);
      else setAtStop(leg);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [leg, atStop, pts.length, onLand, editing2]);
```

Find the postcard's button row and add a Prev button next to it:

```tsx
              <Editable field="stopNotes" index={atStop!}><p>{s.note}</p></Editable>
              <button className="fl-btn sm" onClick={next}>{atStop! + 1 === stops.length ? 'Газардахаар ✈︎' : 'Нислэгээ үргэлжлүүлэх ✈︎'}</button>
```

Replace with:

```tsx
              <Editable field="stopNotes" index={atStop!}><p>{s.note}</p></Editable>
              <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
                {editing2 && atStop! > 0 && <button className="fl-btn sm ghost" onClick={prev}>◀ Өмнөх</button>}
                <button className="fl-btn sm" onClick={next}>{atStop! + 1 === stops.length ? 'Газардахаар ✈︎' : 'Нислэгээ үргэлжлүүлэх ✈︎'}</button>
              </div>
```

(`.row` already exists as a shared utility class — used the same way
elsewhere in this codebase, e.g. `Editor.tsx`'s toolbar. `fl-btn ghost` is
also already a defined variant, used by the "↺ Дахин нисэх" button in the
`land` scene.)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Manual verification**

1. Open Flight's editor, open "Хаанаас → Хаашаа" (`board` scene). Confirm the
   flap rows show their final text immediately, with no letter-cycling
   animation, while the editor is open. (Reload the page and view
   `/templates/flight` in a separate tab to confirm the animation still
   plays normally outside the editor.)
2. Open "Замын буудлууд" (`fly` scene). Click "Нислэгээ үргэлжлүүлэх ✈︎":
   confirm the plane jumps instantly to the next stop with no multi-second
   flying animation, and a "◀ Өмнөх" button now appears (since you're past
   stop 1).
3. Click "◀ Өмнөх" repeatedly back to stop 1: confirm the button disappears
   at stop 1 (no `atStop! > 0`), and each click is instant.
4. Click "▶ Бүтнээр" (full-preview toggle) and repeat step 2 in that mode:
   confirm the flight animation and flap-cycling are back to normal (this
   proves the edit-mode gating is real, not accidentally always-on).

- [ ] **Step 6: Commit**

```bash
git add src/templates/flight/Flight.tsx
git commit -m "Skip fighting animations in Flight's edit mode (Flap, Journey legs, Prev button)"
```

---

## Task 6: Collapsible sidebar (`canvasEditable`) and first-run hint

**Files:**
- Modify: `src/templates/types.ts`
- Modify: `src/templates/flight/meta.ts`
- Modify: `src/components/editor/Editor.tsx`
- Modify: `src/components/editor/editor.css`

**Interfaces:**
- Produces: `TemplateMeta.canvasEditable?: boolean` — read by `Editor.tsx` only.

- [ ] **Step 1: Add `canvasEditable` to `TemplateMeta`**

In `src/templates/types.ts`, find:

```ts
  /** Extra values used only on the public demo/preview. */
  demo?: Content;
};
```

Replace with:

```ts
  /** Extra values used only on the public demo/preview. */
  demo?: Content;
  /** True once this template's View wraps its schema fields in <Editable> — the editor's sidebar starts collapsed for these, since canvas click-to-edit is the primary way to edit them. */
  canvasEditable?: boolean;
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Set the flag on Flight**

In `src/templates/flight/meta.ts`, find:

```ts
export const flightMeta: TemplateMeta = {
  id: 'flight',
```

Replace with:

```ts
export const flightMeta: TemplateMeta = {
  id: 'flight',
  canvasEditable: true,
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Add collapsed-sidebar state and the toggle button**

In `src/components/editor/Editor.tsx`, find:

```ts
  const [share, setShare] = useState(false);
  const [publishing, setPublishing] = useState(false);
```

Replace with:

```ts
  const [share, setShare] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sideOpen, setSideOpen] = useState(!meta.canvasEditable);
  const [hintSeen, setHintSeen] = useState(true);
  useEffect(() => {
    if (!meta.canvasEditable) return;
    setHintSeen(localStorage.getItem('dear:hintSeen') === '1');
  }, [meta.canvasEditable]);
  const dismissHint = useCallback(() => {
    localStorage.setItem('dear:hintSeen', '1');
    setHintSeen(true);
  }, []);
```

In the same file, find the `dear:edit` listener added in Task 1:

```ts
      if (!allFields(meta).some((f) => f.key === field)) return;
      setEditTarget({ field, index, rect });
```

Replace with:

```ts
      if (!allFields(meta).some((f) => f.key === field)) return;
      setEditTarget({ field, index, rect });
      dismissHint();
```

Find the toolbar block:

```tsx
          <button
            className={`btn btn-sm ${previewingFull ? 'btn-primary' : ''}`}
            onClick={() => setPreviewingFull((v) => !v)}
            title="Хэсэг тус бүрт зогсолгүй, эхнээс дуустал бүтнээр нь үзэх"
          >
            ▶ Бүтнээр
          </button>
```

Replace with:

```tsx
          <button
            className={`btn btn-sm ${previewingFull ? 'btn-primary' : ''}`}
            onClick={() => setPreviewingFull((v) => !v)}
            title="Хэсэг тус бүрт зогсолгүй, эхнээс дуустал бүтнээр нь үзэх"
          >
            ▶ Бүтнээр
          </button>
          <button
            className={`btn btn-sm ${sideOpen ? 'btn-primary' : ''}`}
            onClick={() => setSideOpen((v) => !v)}
            title="Бүх талбарын жагсаалт"
          >
            ☰ Бүх талбар
          </button>
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 7: Collapse the sidebar's contents (not the toggle) when closed**

Find:

```tsx
      <aside className="ed-side">
        <div className="ed-lock">🔒 Энэ хуудсыг зөвхөн та засах эрхтэй</div>
```

Replace with:

```tsx
      <aside className="ed-side" data-collapsed={!sideOpen}>
        <div className="ed-lock">🔒 Энэ хуудсыг зөвхөн та засах эрхтэй</div>
```

- [ ] **Step 8: Add collapse CSS and the first-run hint pill**

In `src/components/editor/editor.css`, find:

```css
.ed-side { grid-area: side; overflow-y: auto; padding: 14px 14px 0; background: #fbf8fa; border-right: 1px solid var(--line); }
```

Replace with:

```css
.ed-side { grid-area: side; overflow-y: auto; padding: 14px 14px 0; background: #fbf8fa; border-right: 1px solid var(--line); }
.ed-side[data-collapsed='true'] { display: none; }
.ed-hint { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 10;
  background: var(--ink); color: #fff; font-size: .82rem; font-weight: 600; padding: 10px 16px;
  border-radius: 999px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 24px -10px rgba(0, 0, 0, .5); }
.ed-hint button { border: 0; background: rgba(255, 255, 255, .18); color: #fff; border-radius: 50%; width: 20px; height: 20px; line-height: 1; cursor: pointer; }
```

In `src/components/editor/Editor.tsx`, find:

```tsx
      <section className="ed-stage" ref={stage}>
        <div className="ed-device" data-device={device} style={{ width: d.w * scale, height: d.h * scale }}>
```

Replace with:

```tsx
      <section className="ed-stage" ref={stage}>
        {meta.canvasEditable && !hintSeen && (
          <div className="ed-hint">
            <span>Засах зүйл дээрээ дараарай</span>
            <button type="button" onClick={dismissHint} aria-label="Хаах">✕</button>
          </div>
        )}
        <div className="ed-device" data-device={device} style={{ width: d.w * scale, height: d.h * scale }}>
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 10: Manual verification**

1. Open Flight's editor for the first time (clear `localStorage` for the
   dev origin first, or use a private window). Confirm the sidebar starts
   collapsed (hidden) and a "Засах зүйл дээрээ дараарай" pill shows over the
   preview.
2. Click any `<Editable>` field. Confirm the pill disappears (and, on
   reload, stays gone — `localStorage` flag set).
3. Click "☰ Бүх талбар". Confirm the sidebar (steps nav + accordion) appears
   exactly as it always has, including `color` and `music`'s fields. Click
   it again to collapse it.
4. Open any other template's editor (e.g. Wrapped, Book). Confirm the
   sidebar is open by default (no collapse), no hint pill ever appears, and
   the "☰ Бүх талбар" button is present but starts in the "on" state — i.e.
   toggling it now would collapse a sidebar that's normally always shown for
   these templates, which is acceptable (the button is generic; only Flight
   defaults to collapsed).

- [ ] **Step 11: Commit**

```bash
git add src/templates/types.ts src/templates/flight/meta.ts src/components/editor/Editor.tsx src/components/editor/editor.css
git commit -m "Add collapsible sidebar and first-run hint for canvas-editable templates"
```

---

## Task 7: Mobile bottom sheet and popover invalidation

**Files:**
- Modify: `src/components/editor/EditPopover.tsx`
- Modify: `src/components/editor/editor.css`
- Modify: `src/components/editor/Editor.tsx`

**Interfaces:**
- Consumes: `EditPopover` from Task 4 (with `index`).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Make `EditPopover` render as a bottom sheet under 900px**

Replace `src/components/editor/EditPopover.tsx` with:

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { ContentValue, Field } from '@/templates/types';
import { FieldControl, SingleItemControl, type Uploader } from './Fields';

export type ScreenRect = { top: number; left: number; width: number; height: number };

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return narrow;
}

export function EditPopover({ field, index, value, rect, onChange, onClose, upload }: {
  field: Field;
  index?: number;
  value: ContentValue | undefined;
  rect: ScreenRect;
  onChange: (v: ContentValue) => void;
  onClose: () => void;
  upload: Uploader;
}) {
  const narrow = useIsNarrow();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const control = typeof index === 'number' && (field.type === 'list' || field.type === 'images')
    ? <SingleItemControl field={field} index={index} value={value} onChange={onChange} upload={upload} />
    : <FieldControl field={field} value={value} onChange={onChange} upload={upload} />;

  if (narrow) {
    return (
      <div className="ed-pop-backdrop" onClick={onClose}>
        <div className="ed-sheet" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="ed-pop-close" onClick={onClose} aria-label="Хаах">✕</button>
          {control}
        </div>
      </div>
    );
  }

  const width = 300;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const top = Math.min(Math.max(12, rect.top + rect.height + 8), window.innerHeight - 220);
  return (
    <div className="ed-pop-backdrop" onClick={onClose}>
      <div className="ed-pop" style={{ left, top, width }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ed-pop-close" onClick={onClose} aria-label="Хаах">✕</button>
        {control}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Add bottom-sheet CSS**

In `src/components/editor/editor.css`, find:

```css
.ed-pop-close { position: absolute; top: 6px; right: 8px; border: 0; background: transparent; font-size: .9rem; color: var(--ink-3); line-height: 1; padding: 4px; cursor: pointer; }
```

Replace with:

```css
.ed-pop-close { position: absolute; top: 6px; right: 8px; border: 0; background: transparent; font-size: .9rem; color: var(--ink-3); line-height: 1; padding: 4px; cursor: pointer; }
.ed-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; background: #fff; border-radius: 20px 20px 0 0;
  box-shadow: 0 -20px 50px -12px rgba(60, 20, 50, .35); padding: 20px 16px 24px; max-height: 70vh; overflow-y: auto; }
```

- [ ] **Step 4: Close the popover on device change, `previewingFull` toggle, and window resize**

In `src/components/editor/Editor.tsx`, find:

```ts
  const [editTarget, setEditTarget] = useState<{ field: string; index?: number; rect: ScreenRect } | null>(null);
```

Replace with:

```ts
  const [editTarget, setEditTarget] = useState<{ field: string; index?: number; rect: ScreenRect } | null>(null);
  useEffect(() => { setEditTarget(null); }, [device, previewingFull]);
  useEffect(() => {
    const onResize = () => setEditTarget(null);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 6: Manual verification**

1. In Flight's editor, resize the browser window below 900px width (or open
   dev tools' device toolbar at a phone size). Click any `<Editable>` field.
   Confirm the popover now renders as a bottom sheet (full-width, slid up
   from the bottom) rather than an anchored card.
2. Widen the window back above 900px: confirm new clicks go back to the
   anchored-card style.
3. With a popover open, switch the device toggle (🖥/📱) in the toolbar:
   confirm the popover closes (rather than floating over a stale position).
4. With a popover open, click "▶ Бүтнээр": confirm the popover closes.
5. With a popover open, resize the actual browser window: confirm the
   popover closes.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor/EditPopover.tsx src/components/editor/editor.css src/components/editor/Editor.tsx
git commit -m "Add mobile bottom sheet and popover invalidation on layout changes"
```

---

## Task 8: Full regression pass + Quest/LoveFlix conversion assessment

**Files:** none (verification + a short written assessment, already drafted in the spec's final section — this task just confirms it against the finished implementation)

**Interfaces:** none

- [ ] **Step 1: Full typecheck**

Run: `npm run typecheck`
Expected: passes with zero errors.

- [ ] **Step 2: Confirm the published page and demo preview are byte-identical to before this feature**

1. Publish a Flight page via the editor's "Нийтлэх" flow. Open `/p/<slug>` in
   a new tab. Confirm: normal split-flap animation plays, the journey flies
   normally between stops (no instant jumps), no hover outlines or ✏️ badges
   appear anywhere, no popover opens on click.
2. Visit `/templates/flight` (signed out or without buying). Confirm the
   same — full autoplay demo, nothing clickable.

- [ ] **Step 3: Confirm the five other templates are completely unaffected**

For each of Wrapped, LoveFlix, Quest, Locket, Book: open its editor and
confirm the sidebar is open by default, no `<Editable>` hover effects appear
anywhere in the preview, and editing via the sidebar still works and
autosaves exactly as before this feature.

- [ ] **Step 4: Re-read the spec's "Assessment: converting the remaining templates" section**

Open `docs/superpowers/specs/2026-09-27-canvas-click-to-edit-design.md` and
re-read its final section. Confirm each claim still holds against the
finished code:
- Wrapped/LoveFlix-browse/Book: same shape of conversion as Flight (wrap
  existing DOM elements — no canvas involved). Confirm by spot-checking that
  none of their `View.tsx`/inner components render to `<canvas>` (`grep -rn
  "canvas" src/templates/wrapped src/templates/netflix src/templates/book`
  should only show Quest-unrelated matches, if any).
- Quest and LoveFlix's Episode screen: confirm both actually use `<canvas>`
  by checking `src/templates/quest/Quest.tsx` and the Episode-screen renderer
  inside `src/templates/netflix/LoveFlix.tsx` — this re-confirms the
  assessment was accurate, not just asserted.

- [ ] **Step 5: Final commit (if any cleanup was needed)**

If all checks pass with no further changes, this task needs no commit. If
any manual verification step above surfaced a fix, make it, re-run the
relevant task's typecheck and manual steps, then commit with a message
describing exactly what was fixed.
