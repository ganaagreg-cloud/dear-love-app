# Canvas click-to-edit: shared infrastructure + Flight pilot

## Problem

Editing a page today means hunting through the sidebar's numbered sections and
field list to find the one control that affects what you're looking at in the
live preview. The preview is read-only glass — you can't touch what you see.
This is slower than it should be and doesn't match how buyers expect a "digital
gift builder" to work (Canva-style: click the thing, edit the thing).

## Goal

In the editor, clicking an element in the live preview (text, a photo, a date)
opens a small popover next to that element with just the control for that
field, reusing the same save path as the sidebar. Build the shared
infrastructure once; fully convert **Flight** as the pilot template. Every
other template keeps working exactly as it does today, sidebar-only.

## Scope

**In scope:**
- A reusable `<Editable>` component + edit-mode context, usable by any
  template.
- A popover UI in `Editor.tsx`, anchored to the clicked element, that reuses
  `FieldControl` (and a new single-array-item variant for list/images fields).
- A collapsible "Бүх талбар" (all fields) sidebar, opt-in per template via a
  `TemplateMeta` flag, defaulting to today's always-open sidebar for templates
  that don't opt in.
- Full conversion of **Flight** (`src/templates/flight/*`): every field that
  has a visible on-screen representation becomes clickable.
- A first-run on-canvas hint.
- A written assessment (not an implementation) of what converting Quest and
  LoveFlix's Episode screen would take, since both use `<canvas>`.

**Out of scope (this pass):**
- Converting any template other than Flight.
- Changing the security boundary: every save still goes through
  `PATCH /api/pages/[id]` → `sanitizeContent`. `<Editable>`/the popover never
  write anywhere else.
- Changing `sanitizeContent`, the `Store` interface, pricing, or auth.

## Architecture

### 1. `src/templates/Editable.tsx` — shared edit-mode context + component

```ts
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

export function useEditMode() { return useContext(Ctx).active; }

export function Editable({ field, index, children }: { field: string; index?: number; children: ReactElement }) {
  const { active, onEdit } = useContext(Ctx);
  const ref = useRef<HTMLElement | SVGElement>(null);
  if (!active) return children;
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (ref.current as Element | null)?.getBoundingClientRect();
    if (rect) onEdit(field, index, rect);
  };
  const cloned = isValidElement(children)
    ? cloneElement(children, {
        ref,
        className: [children.props.className, 'dear-editable'].filter(Boolean).join(' '),
        onClick: (e: React.MouseEvent) => { children.props.onClick?.(e); handleClick(e); },
      } as Record<string, unknown>)
    : <span ref={ref as never} className="dear-editable" onClick={handleClick} style={{ display: 'contents' }}>{children}</span>;
  return cloned;
}
```

Notes:
- `cloneElement` is used instead of a wrapper `<div>`/`<span>` so grid/flex/
  absolute layouts inside Flight (and future templates) are never disturbed by
  an extra box. The `display: contents` fallback exists for children that
  aren't a single cloneable host element (e.g. an SVG `<text>` returned from a
  helper, or bare text) — it participates in click/ref but not layout.
- `.dear-editable` (in a new plain stylesheet, `src/templates/editable.css`,
  imported once by `Editable.tsx` — plain CSS, not a module, matching how
  `flight.css`/`editor.css` are imported directly elsewhere in this repo)
  adds `position: relative; cursor: pointer;`
  and, on `:hover`, an `outline: 2px dashed` plus a `::after { content: '✏️' }`
  badge pinned to the top-right corner. Outline doesn't affect box size;
  `position: relative` is safe to add to a flex/grid item (only changes
  stacking/absolute-descendant behavior, not flow).
- Zero cost when `active` is false: `Editable` returns `children` with no
  wrapper, no ref, no listener — published pages (`/p/[slug]`) and the
  standalone demo (`/templates/[id]`) are unaffected, matching how `editable`
  already defaults to falsy there today.

### 2. `RenderFrame.tsx` wraps `TemplateView` in the provider

```tsx
<EditModeProvider active={true}>
  <TemplateView templateId={templateId} content={content ?? initial} pin={pin} editing={editing} editable />
</EditModeProvider>
```

(`RenderFrame` is only ever rendered inside the editor's preview iframe, so
`active` is always `true` here — same as the existing hardcoded `editable`
prop on `TemplateView` today.)

### 3. postMessage protocol: two additions, both additive

**Child → parent**, new message type:
```ts
{ type: 'dear:edit', field: string, index?: number, rect: { top: number; left: number; width: number; height: number } }
```
Sent by `Editable`'s click handler. Same-origin-checked in `Editor.tsx` exactly
like the existing `dear:ready`/`dear:pick-photo` listeners.

**Parent → child**, `dear:content` gains one field:
```ts
{ type: 'dear:content', content: Content, pin: string | number | null, editing: { field: string; index?: number } | null }
```
`editing` is set to the field/index of whatever `Editable` was last clicked
(cleared when the buyer clicks a different section in the sidebar, or when
`previewingFull` is on). `RenderFrame` picks it up alongside `pin`/`content`
and threads it into `TemplateView` → `View.tsx` → the template's inner
component, exactly parallel to how `pin` already flows (see
`docs/superpowers/specs/2026-09-26-editor-page-mode-design.md`). Templates
that don't read `editing` simply ignore it — no behavior change for them.

`editing` exists so a template whose scene has its own internal list
position (Flight's `Journey` tracking which stop is showing) can re-seed that
position after the remount that follows every content edit, instead of
snapping back to its default. It's deliberately generic (keyed by field, not
by template), so a future Book/Wrapped conversion with the same shape of
problem (a list the buyer navigates one item at a time) can reuse it without
protocol changes.

### 4. `Editor.tsx`: the popover

- New state: `editTarget: { field: string; index?: number; rect: DOMRect } | null`.
- New listener for `dear:edit` (same-origin-checked): looks up
  `const f = allFields(meta).find((x) => x.key === field)` (reusing the
  existing `allFields` helper from `types.ts`); looks up the owning `Section`
  (`meta.schema.find((s) => s.fields.some((x) => x.key === field))`) and calls
  `setOpen(section.id)` so the sidebar/pin state stays consistent with today's
  behavior; sets `editTarget`.
- Posts `editing: editTarget && { field: editTarget.field, index: editTarget.index }`
  as part of the existing debounced `post()` call (folded into the same
  `useEffect` that already re-sends on `content`/`pin` change).
- Coordinate conversion: `const iframeRect = frame.current!.getBoundingClientRect();`
  then `popoverX = iframeRect.left + rect.left * scale`, same for `top`,
  using the `scale` state that already drives the iframe's CSS transform.
  `getBoundingClientRect()` on the iframe element itself already accounts for
  the CSS `transform: scale(...)` applied to it, so this is a single
  multiply, not a new coordinate system.
- Renders a `<Popover>` (new component in `src/components/editor/`, e.g.
  `EditPopover.tsx`) fixed-positioned near `(popoverX, popoverY)` (flipped to
  stay on-screen near viewport edges), containing:
  - `FieldControl` unchanged, when `editTarget.index` is `undefined`.
  - A new `SingleItemControl` (in `Fields.tsx`) when `index` is defined and
    the field type is `list` or `images`:
    - `list`: one `<input className="ed-input">` bound to
      `value[index]`, writing back the full array via
      `set(field, arrayWithIndexReplaced)`.
      Reuses the same `set(key, v)` already in `Editor.tsx`.
    - `images`: one image slot (upload/replace/clear-to-empty-string), built
      from the same `useUpload` hook and visual pattern as `ImageSlot` in
      `Fields.tsx`, writing back `value` with just that index replaced.
      Deliberately **never** removes/shifts the array: for Flight,
      `stopPhotos[i]` is positionally coupled to `stopNames[i]`/
      `stopDates[i]`/etc. (parallel arrays, one stop per index — see
      `toFlight()` in `View.tsx`, which already treats a missing photo as
      `''`/falsy), so shifting would desync a stop's photo from its own
      name/note. Clearing sets `''` at that index, same as an empty name.
  - A close (✕) button; clicking the iframe background, pressing Escape, or
    receiving a new `dear:edit` (different target) also closes/replaces it.
- Below a 900px real window width (`window.matchMedia('(max-width: 900px)')`,
  the same breakpoint `editor.css` already uses for the tabbed mobile layout),
  the popover renders as a bottom sheet (fixed to the viewport bottom, full
  width, slide-up) instead of an anchored card — same contents either way.
- The popover closes automatically on `device` change, `previewingFull`
  toggle, or window resize (all of which can invalidate the anchor rect or
  remount the iframe).

### 5. Sidebar becomes collapsible, opt-in per template

`TemplateMeta` (`src/templates/types.ts`) gains one optional field:
```ts
canvasEditable?: boolean; // true once a template's View wraps its fields in <Editable>
```
Only `flightMeta` sets it (`true`) in this pass. `Editor.tsx`'s `<aside
className="ed-side">` gets a new collapsed/expanded boolean state,
initialized to `!meta.canvasEditable` (open by default for every template
that hasn't opted in — i.e. unchanged from today; closed by default only for
Flight). A small "Бүх талбар" toggle button (with a chevron) sits in
`.ed-top`'s right-hand button row, always rendered but only meaningfully
different in default state per the flag. All of the sidebar's existing
internals (numbered steps, accordion, "Дараах" button) are untouched — it's
wrapped, not rewritten.

### 6. First-run hint

A small dismissible pill (`"Засах зүйл дээрээ дараарай"`) absolutely
positioned over `.ed-stage`, shown when `localStorage.getItem('dear:hintSeen') !== '1'`
**and** `meta.canvasEditable`. Dismissed (and flag set) on the first `dear:edit`
message received, or its own ✕. Lives in `Editor.tsx`, not inside the iframe
(simpler: no extra postMessage round trip needed to show/hide it).

### 7. Flight-specific changes

**`Flight.tsx`**
- Reads `useEditMode()` for a plain `editable` boolean (existing prop-less
  context, not passed down manually) — used to skip `Flap`'s char-cycling
  (render final text immediately) and to switch `Journey`'s leg transitions
  from animated to instant.
- Accepts a new `editing?: { field: string; index?: number } | null` prop,
  threaded from `View.tsx` (parallel to `pin`, which it already accepts).
  When `editing?.field` is one of `stopNames`/`stopCodes`/`stopDates`/
  `stopNotes`/`stopPhotos` and `editing.index` is a number, `Journey` seeds
  its initial `leg`/`atStop` to that index (mirrors the existing
  pin-reapply `useEffect` pattern already in the file) instead of `0`.
- `Journey` gains a "◀ Prev" button next to the existing "Continue ✈︎"
  button, enabled whenever `atStop > 0`; both buttons become instant
  (no flight animation, no `requestAnimationFrame` tween) when `editable`
  is true — `setAtStop`/`setLeg` update immediately, camera snaps rather
  than eases.

**`View.tsx`**: `FlightView` reads `pin` and now also `editing`, passing both
to `<Flight data={data} pin={pin} editing={editing} />` (currently `pin` is
already passed; `editing` is new).

**`meta.ts`**: adds `canvasEditable: true`.

**Field → on-canvas anchor mapping** (which scene each field becomes
clickable in; exact JSX wrapping is an implementation detail, this table is
the contract):

| field key | scene | anchor |
|---|---|---|
| `fromCode`, `fromCity`, `toCode`, `toCity` | `board` (call announcement uses `toCity`/`gate`/`passenger` only) + `pass` (route line shows all four) | `pass` scene's route line (`fl-route`) is the primary clickable anchor for all four; `board`'s destination cell also wraps `toCity` |
| `passenger` | `board` (call line) + `pass` (fields grid + stub) | `pass` scene's fields grid |
| `captain` | `pass` | captain line |
| `airline` | `pass` | header logo text |
| `flightNo` | `board` (flap row) + `pass` (fields grid) | `pass` scene's fields grid |
| `date` | `pass` | fields grid |
| `boarding` | `board` (flap row, sliced) + `pass` (fields grid) | `pass` scene's fields grid |
| `gate` | `board` (call line) + `pass` (fields grid) | `pass` scene's fields grid |
| `seat` | `pass` (fields grid + stub) | fields grid |
| `cabin` | `pass` | header class text |
| `stopNames[i]`, `stopDates[i]`, `stopCodes[i]`, `stopNotes[i]`, `stopPhotos[i]` | `fly` (postcard for the currently-shown stop) | postcard's name/date-line/stamp/note/photo respectively — each index-bound |
| `finalTitle`, `finalMessage` | `land` | passport stamp card |
| `color`, `music` | *(no on-canvas anchor)* | sidebar-only (fallback panel) |

Where a field's value is embedded in a sentence with no existing wrapping
element (e.g. `gate` inside "...{data.gate}-р хаалга..."), a minimal
`<b>`/`<span>` gets added around just that value — a visual no-op, purely to
give `Editable` a cloneable anchor.

### Error handling

- Unrecognized `dear:edit.field` (stale message from a template that hasn't
  been rebuilt, or a future protocol mismatch) — `Editor.tsx` looks it up via
  `allFields(meta).find(...)`; if not found, the message is silently ignored
  (no popover opens). Mirrors how `RenderFrame` already ignores malformed
  `dear:content` payloads.
- `editing` pointing at an index beyond the current array length (buyer
  deleted stops after opening the popover) — `Journey`'s seed clamps to
  `Math.min(index, stops.length - 1)`, never throws.
- Popover positioning near a viewport edge flips to the opposite side rather
  than rendering off-screen or clipped.

### Testing

No test suite exists in this repo; verification is manual (`npm run
typecheck` first, then in a browser, demo mode, no Supabase env vars):

1. Open Flight's editor. Confirm the sidebar starts collapsed and a first-run
   hint appears once (and not again after reload, once dismissed).
2. Click each mapped field in the design table above, on desktop width:
   confirm a popover opens anchored near the element, editing it updates the
   preview live and reuses the same debounced-autosave path (watch the
   existing "Хадгалж байна…" indicator).
3. Narrow the window below 900px: confirm the same click opens a bottom
   sheet instead.
4. Click a stop's postcard field on stop 4 (after navigating there), type in
   the popover: confirm the preview stays on stop 4 through the remount
   (doesn't snap back to stop 1). Confirm "◀ Prev" reaches stop 1 without
   animation while in edit mode.
5. Confirm `color` and `music` are reachable only via the "Бүх талбар" panel,
   and that panel toggles open/closed correctly.
6. Confirm the five other templates' editors are unchanged: sidebar open by
   default, no hover outlines/badges anywhere in their previews, no "Бүх
   талбар" behavior difference (button present but inert-by-default since
   `canvasEditable` is unset).
7. Confirm `/p/[slug]` (a published Flight page) and `/templates/flight` (the
   demo preview) render pixel-identical to before this change — no outlines,
   no badges, normal split-flap animation and animated flight restored.

## Assessment: converting the remaining templates (not built this pass)

- **Wrapped, LoveFlix (browse screen), Book**: same shape of work as Flight —
  wrap existing DOM elements in `<Editable>`, no new rendering technology
  needed. Book's photo pool (`photos`, no single `previewPage`) would need
  the same index-seeding treatment as Flight's stops if made click-to-edit
  per-slot (it already has a *slot-click* mechanism today via
  `dear:pick-photo`, which a photo-`<Editable index>` could subsume/replace).
- **Quest**: renders via `<canvas>` (a real mini-platformer with jump
  physics) — there is no DOM element to attach `<Editable>` to; "memories"
  only surface during gameplay. Click-to-edit would require either hit-testing
  canvas coordinates against a manually-maintained map of draw regions (fragile,
  breaks on any visual change to the game) or an entirely separate non-game
  edit view — genuinely a different feature, consistent with this same
  conclusion already reached in the `editor-page-mode` spec for the *pin*
  feature.
- **LoveFlix's Episode screen**: also `<canvas>`-based (video-style
  playback), same constraint as Quest — no DOM anchors exist inside it.
  LoveFlix's other screens (browse, profiles, credits) are plain DOM and
  would convert like Flight.
