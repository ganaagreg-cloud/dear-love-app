# Editor page mode: pin the live preview to the section being edited

## Problem

The editor's live preview iframe (`/render/[id]`) renders each template exactly as a
recipient would see it, timers included. Story-format templates (Wrapped, Flight,
LoveFlix) auto-advance through slides/scenes on their own schedule. A buyer editing,
say, Flight's "Хаанаас → Хаашаа" (route) section — which controls the departures-board
scene — has that scene silently replaced by the boarding pass 4.2 seconds after they
stop typing, because `Flight.tsx`'s `board`→`pass` transition is an unconditional
`setTimeout` with no gate on user interaction. They never get to see their own edit
reflected on the screen they're actually looking at.

Root cause, confirmed by reading the code: `Wrapped/View.tsx`, `Flight/View.tsx`, and
`Book/View.tsx` key their inner story component by a hash/length of the current
content (`key={JSON.stringify(data).length}` or similar), forcing a **full remount on
every content edit** — a workaround for rendering issues specific to each template
(Quest's canvas game loop needs a clean re-init; `react-pageflip` can't re-render its
children in place). Every remount resets local navigation state (`scene`, slide index,
etc.) back to its initial value and restarts any pending timers from zero. As long as
the buyer keeps typing, the timer keeps getting reset and never fires; the moment they
pause to read or think, the last-scheduled timer goes off and the preview jumps ahead.

## Goal

While a buyer has a schema section open in the editor sidebar, the live preview should
show — and stay on — the page/scene/screen that section's fields actually affect, with
no auto-advance racing ahead of them. When they want to see the whole thing flow
together (before publishing), they can switch to a full, unpinned preview that behaves
exactly like the real, published experience.

## Scope

**In scope:** Wrapped, Flight, LoveFlix, Book. All four are genuinely linear (a slide
show, a scene sequence, a screen sequence, a physical page sequence), so a section can
be mapped to the one thing it visually affects.

**Out of scope, and not revisited by a later phase of this same feature:**
- **Quest** — it's a real mini-platformer (canvas game loop, jump physics). Its
  "memories" only surface when the player physically collects them during gameplay,
  not as a passive page. There is no meaningful "page" to pin to without either
  simulating gameplay or building an entirely separate non-game preview mode — a
  different feature, not a variant of this one.
- **Locket** — a vendored, minified GSAP-driven static HTML bundle
  (`public/tpl/locket/template.html`) loaded in a nested `srcDoc` iframe. It isn't a
  React component we control the same way; supporting it would mean modifying
  third-party-style bundled JS directly, not wiring a prop through our own components.

## Architecture

### The postMessage protocol grows one field

Today `Editor.tsx` posts `{ type: 'dear:content', content }` to the preview iframe on
every debounced content change (`Editor.tsx:46`). It gains a second field:

```ts
{ type: 'dear:content', content: Content, pin: string | number | null }
```

`pin` is `null` when nothing should be pinned (no section open, the open section
declares no target, or the buyer has switched to full preview mode). Otherwise it's
the target page identifier: a string scene/slide/screen id for Wrapped/Flight/LoveFlix,
or a page-index number for Book.

`RenderFrame.tsx` picks up `pin` from the message alongside `content` and threads it
into `TemplateView`, which threads it into whichever `View.tsx` is active:

```ts
// RenderFrame.tsx
const [content, setContent] = useState<Content | null>(null);
const [pin, setPin] = useState<string | number | null>(null);
// onMsg: also `setPin(e.data.pin ?? null)`
<TemplateView templateId={templateId} content={content ?? initial} pin={pin} />
```

```ts
// TemplateView.tsx
export default function TemplateView({ templateId, content, pin }: {
  templateId: string; content: Content; pin?: string | number | null;
}) {
  const View = VIEWS[templateId as keyof typeof VIEWS];
  if (!View) return null;
  return <View content={content} pin={pin ?? null} />;
}
```

Every `View.tsx` component's prop type gains an optional `pin?: string | number | null`
that defaults to `null` and is ignored outside the four in-scope templates — Quest's
and Locket's `View.tsx` simply don't declare or use the prop, so passing it from
`TemplateView` is harmless (it's just dropped). For the four in-scope templates,
`View.tsx` is a thin wrapper (it turns flat `Content` into the template's own typed
data shape via `toWrapped`/`toFlight`/`toLoveData`/`toScrapbook`) that renders the
actual story component — `WrappedView` renders `<Wrapped data={data} />`, `FlightView`
renders `<Flight data={data} />`, and so on. Each of these call sites also passes
`pin={pin}` straight through; the `pin` prop itself needs no transformation, since it
already carries a slide/scene/screen/page id or number regardless of the surrounding
content shape. The published page (`/p/[slug]`) and the standalone template preview
(`/templates/[id]`) never send a `pin`, so they render exactly as today: full
autoplay, no change in behavior for recipients.

### `Section` gains an optional `previewPage`

`src/templates/types.ts`'s `Section` type gains one optional field:

```ts
export type Section = {
  id: string; title: string; description?: string; fields: Field[];
  previewPage?: string | number; // which slide/scene/screen/page this section's fields affect
};
```

Only Wrapped's, Flight's, LoveFlix's, and Book's `meta.ts` files set it (mapping
tables below). Quest's and Locket's `meta.ts` never set it — again, a pure no-op for
templates outside scope; nothing about their editor experience changes.

### `Editor.tsx` computes and sends `pin`

```ts
const pin = previewingFull ? null : (meta.schema.find((s) => s.id === open)?.previewPage ?? null);
const post = useCallback(
  () => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current, pin }, window.location.origin),
  [pin],
);
```

`post` already re-runs on every content change (debounced 700ms) and on the iframe's
`dear:ready` message; it additionally needs to re-run when `pin` changes (i.e., when
`open` or `previewingFull` changes) — folded into the existing `useEffect([content, post])`
by adding `pin` and `open`/`previewingFull` to its dependencies, still through the same
debounce so rapid section-switching doesn't spam the iframe.

### Full-preview toggle

A new boolean, `previewingFull`, sits next to the existing `device` state. A small
toggle button goes in the editor's top toolbar, next to the desktop/mobile switch:
"Урьдчилан үзэх" (Preview). Turning it on sends `pin: null` regardless of which
section is open, handing the template back full control — autoplay resumes, scenes
advance the way they will for the real recipient. Turning it off returns to pinned
mode. Editing remains possible in both states; this only affects what the preview
shows, not whether the sidebar is usable.

### Each in-scope template: honoring `pin`

The two remount-per-keystroke templates (Wrapped, Flight) and the one that remounts
for a different, unrelated reason (Book) all get the same shape of fix: compute
**initial** local navigation state from `pin` (which naturally re-applies on every
remount, since a fresh mount re-runs `useState`'s initializer), and gate every
unconditional timer behind "don't run while pinned." LoveFlix doesn't remount, so it
needs a small reactive effect instead.

#### Wrapped (`src/templates/wrapped/Wrapped.tsx`)

`slides[]` is already keyed by id (`'top'`, `'songs'`, `'places'`, `'words'`,
`'persona'`, `'photos'`, `'msg'`; the cover/intro state is `i === -1`, not a slide).
Accept a new `pin?: string | number | null` prop. Initial state changes from
`useState(-1)` to:

```ts
const pinnedIndex = pin === '__intro__' ? -1 : pin ? slides.findIndex((s) => s.id === pin) : -1;
const [i, setI] = useState(pinnedIndex >= 0 || pin === '__intro__' ? pinnedIndex : -1);
```

(If the target slide isn't currently in the array — e.g. the buyer cleared all songs
while "Топ 5 дуу" is open — `pinnedIndex` is `-1` and the preview falls back to the
cover; an acceptable, rare edge case, not worth a special empty-state.)

The auto-advance effect (`Wrapped.tsx:180`) gains one line: `if (i < 0 || paused ||
i === last || pin) return;` — pinned means no auto-advance, full stop, regardless of
which slide it landed on.

**`meta.ts` section → `previewPage` mapping:**

| section id | previewPage |
|---|---|
| `basics` | `'__intro__'` (the cover/start screen — theme color and names/year show there) |
| `moment` | `'top'` |
| `songs` | `'songs'` |
| `places` | `'places'` |
| `words` | `'words'` |
| `persona` | `'persona'` |
| `photos` | `'photos'` |
| `message` | `'msg'` |

(The final `'summary'` slide has no owning section — it's an auto-generated recap, not
something a buyer edits directly. That's fine; not every internal page needs a section
pointing to it.)

#### Flight (`src/templates/flight/Flight.tsx`)

Accept `pin?: string | number | null`. Initial state:

```ts
const [scene, setScene] = useState<Scene>(pin === 'board' || pin === 'pass' || pin === 'fly' || pin === 'land' ? pin : 'board');
```

The board→pass timer (`Flight.tsx:104`) gains the same guard: `if (scene === 'board'
&& !pin) { ...timeout... }`. The tear→fly timeout (`Flight.tsx:110`, inside the click
handler that tears the boarding pass) doesn't need a guard — it only runs after the
buyer's own click inside the iframe, which doesn't happen from sidebar editing.

**`meta.ts` section → `previewPage` mapping:**

| section id | previewPage |
|---|---|
| `ticket` | `'pass'` |
| `route` | `'board'` |
| `stops` | `'fly'` |
| `landing` | `'land'` |

#### LoveFlix (`src/templates/netflix/LoveFlix.tsx`)

Doesn't remount — needs a reactive effect instead of an initializer:

```ts
useEffect(() => {
  if (pin && (pin === 'profiles' || pin === 'intro' || pin === 'browse' || pin === 'episode' || pin === 'credits')) setScreen(pin);
}, [pin]);
```

The intro→browse timer (`LoveFlix.tsx:43`) gains `if (screen !== 'intro' || pin)
return;` — defensive; since no section ever pins to `'intro'`, this timer should never
actually be reachable via `pin`-driven navigation, but the guard costs nothing and
protects against a future mapping mistake.

**`meta.ts` section → `previewPage` mapping:**

| section id | previewPage |
|---|---|
| `basics` | `'browse'` |
| `photos` | `'browse'` (most fields here — `heroPhoto`, `cwPhotos`, `hitPhotos` — show on browse; `profilePhoto`, `ep1Bg`/`ep2Bg`/`climaxBg` don't get individual representation) |
| `show` | `'browse'` |
| `episode` | `'episode'` |

#### Book (`src/templates/book/View.tsx` / `Scrapbook.tsx`)

Book's schema needs restructuring first: its current `pages` section is a single flat
bucket of fields spanning six different physical pages (confirmed by reading
`pages.tsx`), so no single `previewPage` value could represent it. Splitting it is
purely organizational — every field keeps its existing `key`, so already-saved buyer
content stays fully compatible. `pages` becomes six sections:

| new section id | title (Mongolian) | fields (moved as-is, same keys) | previewPage |
|---|---|---|---|
| `lucky` | Азтай | `texts.lucky`, `texts.luckyNote` | `2` |
| `letter` | Захидал | `texts.letterEyebrow`, `texts.letterTitle`, `texts.letterBody`, `texts.ticket` | `3` |
| `little` | Жижигхэн зүйлс | `texts.littleTitle`, `texts.littleNote` | `4` |
| `places` | Газрууд | `texts.placesLabel`, `texts.placesNote`, `texts.postmark` | `5` |
| `notes` | Тэмдэглэлүүд | `texts.notesTitle`, `texts.noteOneLabel/One`, `texts.noteTwoLabel/Two`, `texts.noteThree`, `texts.finalList` | `6` |
| `pocket` | Халаастай хуудас | `texts.pocketTitle`, `texts.tomorrow` | `10` |

Plus the two sections that already exist and get a `previewPage` added:

| section id | previewPage |
|---|---|
| `basics` | `0` (front cover — where `partnerName`, `coverEyebrow`, `coverSub` render; `heartColor` and `keepsakeDate` don't get individual representation) |
| `song` | `1` (the record page — where `recordLabel`/`recordWords` render; the soundtrack pages 7–8 are a continuation of the same fields and don't need separate representation) |
| `photos` | *(no `previewPage` — the 10-photo pool is spread across all 12 pages via `p(slot % length)`; no single page represents it, so pinning is skipped and the preview simply stays wherever it currently is)* |
| `back` | `11` |

`Scrapbook.tsx`/its `View.tsx` wrapper accepts `pin?: string | number | null` and, once
mounted (`react-pageflip` needs a tick after mount to be ready), calls
`book.current?.pageFlip()?.flip(Number(pin))` when `pin` is a number. Since Book never
auto-advances on its own, there's no timer to guard — this is pure "jump to page,"
nothing to suppress.

### Error handling

- An unrecognized or stale `pin` value (targets a slide/scene/page id that doesn't
  exist, e.g. after a template's internal ids ever change) falls back to that
  template's default starting state — never throws, never blanks the preview.
- The `postMessage` payload shape change is additive (`pin` is a new, optional field);
  an old cached service-worker or iframe that hasn't picked up the change yet simply
  sees `pin` as `undefined`, which `RenderFrame.tsx` coerces to `null` — behaves like
  today, no pin applied.

### Testing

No test suite exists in this repo (`CLAUDE.md`); verification is manual, via
`npm run typecheck` plus the "run" workflow in a real browser:

1. Open the editor for each of the four in-scope templates. Open each section in turn
   and confirm the preview shows the mapped page and stays there while typing —
   specifically re-test Flight's `route` section (the reported bug) by typing slowly
   with pauses longer than 4.2s and confirming the board scene never auto-advances.
2. Toggle "Урьдчилан үзэх" (full preview) and confirm normal autoplay resumes exactly
   as the published page behaves.
3. Confirm the published page (`/p/[slug]`) and the standalone demo preview
   (`/templates/[id]`) are visually and behaviorally unchanged (no `pin` ever sent
   there).
4. For Book specifically: confirm the six new sections save/load content identical to
   before the split (edit a field, reload the editor, confirm the value persisted) —
   this is the one change touching an existing schema's shape, worth explicit
   before/after verification.
