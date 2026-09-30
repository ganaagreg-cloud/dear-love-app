'use client';
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Content, Section } from '@/templates/types';
import { TextBox, asArr, useUpload, type Tokens, type Uploader } from './Fields';

type Cfg = NonNullable<Section['cards']>;

/**
 * Parallel photo/title/note arrays edited as one card per item. Dragging a card by its
 * handle reorders all three arrays together, so the stored shape never changes.
 */
export function Cards({ cfg, content, onPatch, upload, tokens, titleMax, textMax, onFocusCard, badges }: {
  cfg: Cfg; content: Content; onPatch: (patch: Content) => void; upload: Uploader;
  tokens?: Tokens; titleMax?: number; textMax?: number; onFocusCard: (i: number) => void;
  /** «Хаана юу байна» numbers by field key. */
  badges?: Record<string, number>;
}) {
  const col = (key: string) => Array.from({ length: cfg.count }, (_, i) => asArr(content[key])[i] ?? '');
  const photos = col(cfg.image), titles = col(cfg.title), texts = col(cfg.text);
  // Cards shown = up to the last one with content, plus any empty ones the buyer just added.
  let filled = 0;
  for (let i = 0; i < cfg.count; i++) if (photos[i] || titles[i].trim() || texts[i].trim()) filled = i + 1;
  const [added, setAdded] = useState(0);
  const shown = Math.min(cfg.count, Math.max(1, filled + added));
  const remove = (i: number) => {
    const drop = (arr: string[]) => [...arr.slice(0, i), ...arr.slice(i + 1), ''];
    onPatch({ [cfg.image]: drop(photos), [cfg.title]: drop(titles), [cfg.text]: drop(texts) });
    setAdded((a) => Math.max(0, a - (i >= filled ? 1 : 0)));
  };

  const setAt = (key: string, arr: string[], i: number, v: string) => { const next = [...arr]; next[i] = v; onPatch({ [key]: next }); };
  // several pointer moves can land before React re-renders — always shift the newest order
  const cur = useRef({ photos, titles, texts });
  cur.current = { photos, titles, texts };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= shown || from === to) return; // never into a hidden slot / the add row
    const shift = (arr: string[]) => { const next = [...arr]; next.splice(to, 0, ...next.splice(from, 1)); return next; };
    const c = cur.current;
    cur.current = { photos: shift(c.photos), titles: shift(c.titles), texts: shift(c.texts) };
    onPatch({ [cfg.image]: cur.current.photos, [cfg.title]: cur.current.titles, [cfg.text]: cur.current.texts });
    onFocusCard(to);
  };

  /* pointer-driven drag (works with touch, unlike HTML5 drag-and-drop) */
  const list = useRef<HTMLOListElement>(null);
  const drag = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const down = (i: number) => (e: RPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = i; setDragging(i); onFocusCard(i);
  };
  const over = (e: RPointerEvent<HTMLButtonElement>) => {
    const from = drag.current;
    if (from == null || !list.current) return;
    const cards = [...list.current.children] as HTMLElement[];
    const to = cards.findIndex((c) => { const r = c.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom; });
    if (to < 0 || to === from) return;
    // only swap once the pointer passes the neighbour's middle, so it doesn't flicker at the edge
    const r = cards[to].getBoundingClientRect();
    if (to > from ? e.clientY < r.top + r.height / 2 : e.clientY > r.top + r.height / 2) return;
    move(from, to);
    drag.current = to; setDragging(to);
  };
  const up = () => { drag.current = null; setDragging(null); };

  return (
    <ol className="ed-cards" ref={list}>
      {photos.slice(0, shown).map((src, i) => (
        <li
          key={i}
          className={`ed-card ${dragging === i ? 'dragging' : ''}`}
          onFocusCapture={() => onFocusCard(i)}
          onPointerDownCapture={() => onFocusCard(i)}
        >
          <div className="ed-card-head">
            <button
              type="button" className="ed-card-handle" aria-label={`${cfg.itemLabel} ${i + 1}-г зөөх (↑ ↓ товчоор)`} title="Чирж байрыг нь солих"
              onPointerDown={down(i)} onPointerMove={over} onPointerUp={up} onPointerCancel={up}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  const to = i + (e.key === 'ArrowUp' ? -1 : 1);
                  move(i, to);
                  requestAnimationFrame(() => (list.current?.children[to]?.querySelector('.ed-card-handle') as HTMLElement | null)?.focus());
                }
              }}
            >⠿</button>
            <b>{cfg.itemLabel} {i + 1}</b>
            {badges && (
              <span className="ed-card-badges" title="Зураг · гарчиг · тэмдэглэл">
                {[cfg.image, cfg.title, cfg.text].map((k) => <i key={k} className="ed-badge">{badges[k]}</i>)}
              </span>
            )}
            {!src && <span className="ed-card-warn">⚠ Зураггүй</span>}
            {shown > 1 && (
              <button type="button" className="ed-card-del" onClick={() => remove(i)} aria-label={`${cfg.itemLabel} ${i + 1}-г хасах`} title="Хасах">✕</button>
            )}
          </div>
          <div className="ed-card-body">
            <div data-edit-field={`${cfg.image}.${i}`}><CardPhoto src={src} upload={upload} onChange={(u) => setAt(cfg.image, photos, i, u)} /></div>
            <div className="ed-card-text">
              <div data-edit-field={`${cfg.title}.${i}`}><TextBox value={titles[i]} max={titleMax} placeholder="Гарчиг" label={`${cfg.itemLabel} ${i + 1} — гарчиг`}
                onChange={(v) => setAt(cfg.title, titles, i, v)} /></div>
              <div data-edit-field={`${cfg.text}.${i}`}><TextBox multiline value={texts[i]} max={textMax} rows={3} placeholder="Тэмдэглэл" tokens={tokens} label={`${cfg.itemLabel} ${i + 1} — тэмдэглэл`}
                onChange={(v) => setAt(cfg.text, texts, i, v)} /></div>
              {textMax && <small className={`ed-card-count ${texts[i].length > textMax * 0.9 ? 'warn' : ''}`}>{texts[i].length}/{textMax}</small>}
            </div>
          </div>
        </li>
      ))}
      {shown < cfg.count && (
        <li className="ed-card-addrow">
          <button type="button" className="ed-add wide" onClick={() => { setAdded((a) => a + 1); onFocusCard(shown); }}>
            <b>＋</b><span>{cfg.itemLabel} нэмэх ({shown}/{cfg.count})</span>
          </button>
        </li>
      )}
    </ol>
  );
}

function CardPhoto({ src, upload, onChange }: { src: string; upload: Uploader; onChange: (u: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, err, run } = useUpload(upload);
  const pick = async (files: FileList | null) => { if (!files?.length) return; const [u] = await run([files[0]], 'image'); if (u) onChange(u); };
  return (
    <div className="ed-card-photo">
      {src ? (
        <div className="ed-thumb">
          <img src={src} alt="" />
          <div className="ed-thumb-actions">
            <button type="button" onClick={() => input.current?.click()} aria-label="Зураг солих">↻</button>
            <button type="button" onClick={() => onChange('')} aria-label="Зураг устгах">✕</button>
          </div>
        </div>
      ) : (
        <button type="button" className="ed-add missing" onClick={() => input.current?.click()} disabled={busy > 0}>
          {busy ? <span className="ed-spin" /> : <><b>＋</b><span>Зураг</span></>}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { void pick(e.target.files); e.target.value = ''; }} />
      {err && <p className="ed-help err">{err}</p>}
    </div>
  );
}
