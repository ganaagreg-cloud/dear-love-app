# Template authoring

A template is a folder `src/templates/<id>/` plus three registrations:

| File | What it is |
| --- | --- |
| `meta.ts` | `TemplateMeta` — price (the **only** source of truth for what's charged), the editable `schema`, `defaults`, `demo` |
| `View.tsx` | `({ content, pin, editable }) => …` — renders the gift |
| `quick.ts` | `QuickSpec` — how the 4-step quick create flow fills this template (see below) |

Register it in `registry.ts` (`TEMPLATES`), `TemplateView.tsx` (`VIEWS`) and `quickRegistry.ts` (`QUICK`), and add `public/covers/<id>.jpg`.
The editor, validation (`sanitize.ts`), live preview and publishing all work off the schema.

## Props your View gets

- `content` — the buyer's saved values (already merged over `defaults`).
- `pin` — the editor asks you to show one page/scene. It's whatever you put in a section's or field's
  `previewPage` (and `<prefix><i>` for list items, see `itemPreview` / `cards.previewPrefix`).
  Show that scene frozen — the buyer should never have to play through the gift to see what they're editing.
  `pin = null` means "play normally from the start".
- `editable` — `true` inside the editor, `false` for the recipient (the published page and the quick flow's
  final «what they'll see» step).

## Rule: the recipient never sees an empty placeholder

With `editable === false`, an empty photo slot, list item or optional text renders **nothing** — no grey tile,
no ♥ stand-in, no «+ add photo». Lay out what's there (fewer chests, fewer stops, a strip without a frame).
While `editable`, a «+ Зураг нэмэх» tile is fine — it helps the buyer.

## Field ↔ preview mapping: `data-field`

Give every element that shows an editable value the id of its editor field:

```tsx
<h1 data-field="title">{data.title}</h1>                  // a single field
<p data-field={`memoryTexts.${i}`}>{mem.text}</p>          // item i of a list / images field
<img data-field={`stopPhotos.${stop.i}`} … />              // keep the ORIGINAL index when you skip empty items
```

That's all a template needs. `useFieldHighlight` (`fieldHighlight.ts`, mounted once in the render frame) then:

- **field → preview**: when the buyer focuses/hovers a field in the editor, outlines the element(s) with a pink
  2px border, a soft glow, one pulse and a floating label with the field name;
- **preview → field**: in edit mode shows a hover outline and a pencil cursor, and clicking the element opens its
  step, scrolls to the field, focuses and flashes it (on a phone: opens the field in a bottom sheet);
- **«Хаана юу байна»**: draws numbered badges on every element, matching the numbers next to the fields.

Details:

- The id is the schema `key` (`texts.lucky`, `ov.synopsis`, …) or `key.<index>` for arrays. Nested ids like
  `chest.2.title` are not used — the editor stores parallel arrays (`memoryTitles.2`).
- Several elements may share an id (a name shown in three places) — all of them get highlighted.
- Nesting is fine: clicks resolve to the **closest** `[data-field]`, so a wrapper can carry a broad field
  (`consoleColor` on the console) while its children carry specific ones.
- Add `data-pick` to an element that handles clicks itself in the editor (Book's photo tiles open the file
  picker directly); click-to-edit leaves it alone.
- Same-origin child iframes are searched too (Locket's story sets its ids from its own script).
- Audio-only fields (`music`) have nothing to point at unless you render a control for them.

### Showing an element that isn't on screen

If the element isn't rendered or visible yet, the editor's `pin` usually takes care of it (set `previewPage`
on the section or field, `itemPreview: 'stop:'` on a list so item 2 pins `stop:2`, or `cards.previewPrefix`).
When the element exists but sits on another page (Book) or scene (Locket), register a reveal callback:

```tsx
useReveal(useCallback((el: Element | null) => {
  const page = el?.closest('[data-page]')?.getAttribute('data-page');
  if (page != null) flipTo(Number(page));
}, []));
```

Without one, the element is scrolled into view.

## Quick create: `quick.ts`

The default flow asks only for two names, an optional date, 5–20 photos and a tone
(Хөөрхөн / Романтик / Хөгжилтэй / Энгийн, or «Өөрөө бичих» for the main message). Your `QuickSpec`:

- `maxPhotos` — how many photos you can place (the uploader stops there);
- `pins` — the scene to show while each step is open;
- `read(content)` — pull names/date/photos back out, so the flow can be reopened;
- `names`, `photos`, `texts` — return a content patch. `texts` must fill **every** text the gift shows, for the
  chosen tone, using the names and date; use the shared copy in `quick.ts` (`MEMORIES`, `LINES`) where it fits;
- `messageKey` — the field «Өөрөө бичих» edits.

Adapt to the photo count (Quest makes one chest per photo, Book fills one photo per page first). Every value is
still clipped by `sanitizeContent` — keep copy within each field's `max`.
