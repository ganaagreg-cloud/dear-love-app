'use client';
import type { Content, Field, Section, TemplateMeta } from '@/templates/types';
import { EmojiPicker, ImageSlot, PhotoHint, TextBox, asArr, type Tokens, type Uploader } from './Fields';
import { CardOne } from './Cards';

/**
 * The editor walks the buyer through the gift one page at a time. Most sections are already one
 * page; a section with `cards` (Quest chests) or `perItem` (Flight stops) is split into one step
 * per item — «Буудал 1», «Буудал 2», … — so each step holds just that page's photo and words.
 */
export type Step = { key: string; sec: Section; item?: number };

const isItemField = (f: Field) => f.type === 'list' || f.type === 'images';
export const itemCount = (s: Section) => s.cards?.count ?? s.perItem?.count ?? 0;
export const itemLabel = (s: Section) => s.cards?.itemLabel ?? s.perItem?.label ?? '';
export const itemFields = (s: Section) => s.fields.filter(isItemField);

/** Index of the last item that has anything in it (-1 if none). */
function lastFilled(s: Section, c: Content) {
  let last = -1;
  for (const f of itemFields(s)) asArr(c[f.key]).forEach((v, i) => { if (v?.trim() && i > last) last = i; });
  return last;
}

/** One step per page; `cards` sections show the items filled so far plus the next empty one. */
export function buildSteps(meta: Pick<TemplateMeta, 'schema'>, content: Content, open: string): Step[] {
  const out: Step[] = [];
  for (const sec of meta.schema) {
    const n = itemCount(sec);
    if (!n) { out.push({ key: sec.id, sec }); continue; }
    const openItem = open.startsWith(`${sec.id}#`) ? Number(open.slice(sec.id.length + 1)) : -1;
    // perItem sections (Flight's 6 stops) list every item up front; cards (Quest's 12 chests) grow as they're filled
    const shown = sec.perItem ? n : Math.min(n, Math.max(1, lastFilled(sec, content) + 2, openItem + 1));
    for (let i = 0; i < shown; i++) out.push({ key: `${sec.id}#${i}`, sec, item: i });
  }
  return out;
}

export const stepKeyFor = (sec: Section, idx: number | null) => {
  const n = itemCount(sec);
  return n ? `${sec.id}#${Math.min(idx ?? 0, n - 1)}` : sec.id;
};

export const stepTitle = (st: Step) => (st.item == null ? st.sec.title : `${itemLabel(st.sec)} ${st.item + 1}`);

/** Preview scene for a step: the item's own scene (`stop:2`, `chest:0`), else the section's. */
export function stepPin(st: Step): string | number | null {
  if (st.item != null) {
    const prefix = st.sec.cards?.previewPrefix ?? itemFields(st.sec).find((f) => f.itemPreview)?.itemPreview;
    if (prefix) return `${prefix}${st.item}`;
  }
  return st.sec.previewPage ?? null;
}

/** One item's controls: its photo and words, nothing else. */
export function ItemStep({ step, content, onPatch, upload, tokens }: {
  step: Step; content: Content; onPatch: (p: Content) => void; upload: Uploader; tokens?: Tokens;
}) {
  const { sec } = step, i = step.item!;
  if (sec.cards) {
    const maxOf = (k: string) => { const f = sec.fields.find((x) => x.key === k); return f && 'max' in f ? f.max : undefined; };
    return (
      <CardOne
        cfg={sec.cards} i={i} content={content} onPatch={onPatch} upload={upload}
        tokens={sec.fields.find((x) => x.key === sec.cards!.text)?.tokens ? tokens : undefined}
        titleMax={maxOf(sec.cards.title)} textMax={maxOf(sec.cards.text)}
      />
    );
  }
  return (
    <>
      {itemFields(sec).map((f) => {
        const arr = asArr(content[f.key]);
        const set = (v: string) => { const next = Array.from({ length: Math.max(arr.length, i + 1) }, (_, k) => arr[k] ?? ''); next[i] = v; onPatch({ [f.key]: next }); };
        const max = f.type === 'list' ? f.max : undefined;
        return (
          <div className="ed-field" key={f.key} data-edit-field={`${f.key}.${i}`}>
            <label className="ed-label"><span>{f.type === 'images' ? 'Зураг' : f.label}</span></label>
            {f.type === 'images'
              ? <><ImageSlot url={arr[i] ?? ''} onChange={set} upload={upload} /><PhotoHint /></>
              : f.type === 'list' && f.emojis ? <EmojiPicker value={arr[i] ?? ''} options={f.emojis} onChange={set} />
              : <TextBox multiline={(max ?? 200) > 40} value={arr[i] ?? ''} max={max} rows={(max ?? 0) > 100 ? 4 : 2} placeholder={(f.type === 'list' && f.placeholders?.[i]) || f.label} tokens={f.tokens ? tokens : undefined} onChange={set} />}
            {f.help && f.type === 'list' && f.emojis && <p className="ed-help">{f.help}</p>}
            {f.example && !arr[i] && <button type="button" className="ed-example" onClick={() => set(f.example!)}>Жишээ: «{f.example}» ← дарж оруулах</button>}
          </div>
        );
      })}
    </>
  );
}
