'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Content, ContentValue, Field, TemplateMeta } from '@/templates/types';
import { DateInput } from './DatePicker';
import { daysTogether, todayIso } from '@/lib/dates';

export { DateInput };
import { spotifyId } from '@/templates/sanitize';
import { MUSIC, musicUrl, type Track } from '@/lib/music';

export type Uploader = (file: File, kind: 'image' | 'audio', maxMB?: number) => Promise<string>;

export type Tokens = NonNullable<TemplateMeta['tokens']>;

type Props = {
  field: Field; value: ContentValue | undefined; onChange: (v: ContentValue) => void; upload: Uploader;
  /** Insert chips for this field's text boxes (only passed when the field opts in). */
  tokens?: Tokens;
  onFocus?: () => void;
  /** «Хаана юу байна» number, matching the badge on the preview element. */
  badge?: number;
  /** Whole page content — only for fields that depend on another field (a goal that depends on a start date). */
  content?: Content;
};

export const asStr = (v: unknown) => (typeof v === 'string' ? v : '');
export const asArr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

export const PhotoHint = () => (
  <p className="ed-help">📷 Хамтдаа авхуулсан зураг сайхан харагдана · босоо (4:5) хамгийн тохиромжтой · 10 MB хүртэл, том зургийг бид өөрөө жижигрүүлнэ</p>
);

/** «Жишээ: «…» ← дарж оруулах» — fills the field (or a list's first empty item) with the sample. */
function Example({ field: f, value, onChange }: { field: Field; value: ContentValue | undefined; onChange: (v: ContentValue) => void }) {
  if (!f.example) return null;
  if (f.type === 'list') {
    const arr = Array.from({ length: f.count }, (_, i) => asArr(value)[i] ?? '');
    const at = arr.findIndex((x) => !x.trim());
    if (at < 0 || arr.includes(f.example)) return null;
    return <button type="button" className="ed-example" onClick={() => { const next = [...arr]; next[at] = f.example!; onChange(next); }}>Жишээ: «{f.example}» ← дарж оруулах</button>;
  }
  if (asStr(value) === f.example) return null;
  return <button type="button" className="ed-example" onClick={() => onChange(f.example!)}>Жишээ: «{f.example}» ← дарж оруулах</button>;
}

/** Anything a buyer might write more than a line of gets a growing box, never a one-line input. */
const LONG = 40;

export function FieldControl({ field: f, value, onChange, upload, tokens, onFocus, badge, content }: Props) {
  // data-edit-field: how the editor maps focus/hover here ↔ the element in the preview
  return (
    <div className="ed-field" data-edit-field={f.key} onFocusCapture={onFocus}>
      {f.type !== 'toggle' && (
        <label className="ed-label">
          <span>{badge != null && <i className="ed-badge">{badge}</i>}{f.label}</span>
          {(f.type === 'text' || f.type === 'textarea') && f.max && (
            <small className={asStr(value).length > f.max * 0.9 ? 'warn' : ''}>{asStr(value).length}/{f.max}</small>
          )}
          {f.type === 'images' && <small>{asArr(value).filter(Boolean).length}/{f.max}</small>}
        </label>
      )}
      <Control field={f} value={value} onChange={onChange} upload={upload} tokens={tokens} content={content} />
      {f.help && <p className="ed-help">{f.help}</p>}
      {(f.type === 'image' || f.type === 'images') && <PhotoHint />}
      {f.example && <Example field={f} value={value} onChange={onChange} />}
    </div>
  );
}

function Control({ field: f, value, onChange, upload, tokens, content }: Props) {
  switch (f.type) {
    case 'text':
      return <TextBox value={asStr(value)} max={f.max} placeholder={f.placeholder} tokens={tokens} onChange={onChange} />;
    case 'textarea':
      return <TextBox multiline value={asStr(value)} max={f.max} rows={f.rows} placeholder={f.placeholder} tokens={tokens} onChange={onChange} />;
    case 'date':
      return <DateInput value={asStr(value)} onChange={onChange} max={f.notFuture ? todayIso() : undefined} pickOnly={f.pickOnly} />;
    case 'select': {
      // a goal measured in days is closed once the couple has already passed it
      const elapsed = f.daysSince && content ? daysTogether(asStr(content[f.daysSince])) : 0;
      return (
        <div className="ed-seg">
          {f.options.map((o) => {
            const past = o.days != null && elapsed >= o.days;
            return (
              <button
                type="button" key={o.value} disabled={past} title={past ? 'Та хоёр энэ хоногоос аль хэдийн давсан' : undefined}
                aria-pressed={asStr(value) === o.value} className={asStr(value) === o.value ? 'on' : ''} onClick={() => onChange(o.value)}
              >{o.label}</button>
            );
          })}
        </div>
      );
    }
    case 'toggle':
      return (
        <label className="ed-toggle">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <i /><span>{f.label}</span>
        </label>
      );
    case 'color':
      return (
        <div className="ed-colors">
          {(f.presets ?? []).map((c) => (
            <button type="button" key={c} aria-label={c} aria-pressed={asStr(value).toLowerCase() === c.toLowerCase()} className={asStr(value).toLowerCase() === c.toLowerCase() ? 'on' : ''} style={{ background: c }} onClick={() => onChange(c)} />
          ))}
          <CustomColor value={asStr(value)} presets={f.presets ?? []} onChange={onChange} />
        </div>
      );
    case 'list': {
      const arr = Array.from({ length: f.count }, (_, i) => asArr(value)[i] ?? '');
      return (
        <div className="ed-list">
          {arr.map((v, i) => (
            <div key={i} data-edit-field={`${f.key}.${i}`}>
              <TextBox multiline={(f.max ?? 200) > LONG} value={v} max={f.max} rows={2} placeholder={f.placeholders?.[i] ?? `${f.itemLabel ?? 'Мөр'} ${i + 1}`} tokens={tokens}
                onChange={(t) => { const next = [...arr]; next[i] = t; onChange(next); }} />
            </div>
          ))}
        </div>
      );
    }
    case 'spotify': {
      const id = spotifyId(asStr(value));
      return (
        <>
          <input className="ed-input" value={asStr(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value.trim())} />
          {asStr(value) && (
            <p className={`ed-help ${id ? 'ok' : 'warn'}`}>{id ? '✓ Дуу олдлоо' : 'Spotify дээрх «Share → Copy song link» холбоосыг буулгана уу'}</p>
          )}
          {id && <iframe className="ed-spotify" title="Spotify" src={`https://open.spotify.com/embed/track/${id}`} height={80} loading="lazy" allow="encrypted-media" />}
        </>
      );
    }
    case 'image':
      return <ImageSlot url={asStr(value)} onChange={(u) => onChange(u)} upload={upload} />;
    case 'images':
      return <ImageGrid fkey={f.key} urls={asArr(value)} max={f.max} onChange={(u) => onChange(u)} upload={upload} />;
    case 'audio':
      return <MusicPicker url={asStr(value)} onChange={(u) => onChange(u)} only={f.tracks} />;
  }
}

/**
 * Text input that becomes a self-sizing textarea (no inner scrollbar) for anything longer
 * than a short label, with optional «+ Түүний нэр»-style chips that insert a placeholder
 * token at the cursor. Single-line fields rendered as a textarea still refuse newlines.
 */
export function TextBox({ value, onChange, max, placeholder, rows = 2, multiline, tokens, label }: {
  value: string; onChange: (v: string) => void; max?: number; placeholder?: string; rows?: number;
  multiline?: boolean; tokens?: Tokens; label?: string;
}) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const sel = useRef<[number, number] | null>(null);
  const oneLine = !multiline;
  const grow = !oneLine || (max ?? 0) > LONG;
  const fit = () => {
    const el = ref.current;
    if (!el || !grow) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
  };
  useLayoutEffect(fit, [value, grow]);
  // re-fit when the sidebar changes width (line wrapping changes); ignore our own height changes
  useEffect(() => {
    const el = ref.current;
    if (!el || !grow) return;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => { if (el.clientWidth !== w) { w = el.clientWidth; fit(); } });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grow]);

  const remember = () => { const el = ref.current; if (el) sel.current = [el.selectionStart ?? value.length, el.selectionEnd ?? value.length]; };
  const change = (v: string) => onChange(oneLine ? v.replace(/\r?\n/g, ' ') : v);
  const insert = (tok: string) => {
    const [a, b] = sel.current ?? [value.length, value.length];
    const next = value.slice(0, a) + tok + value.slice(b);
    if (max && next.length > max) return;
    onChange(next);
    const at = a + tok.length;
    sel.current = [at, at];
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(at, at); });
  };
  const common = {
    ref, className: 'ed-input', value, maxLength: max, placeholder, 'aria-label': label,
    onSelect: remember, onKeyUp: remember, onClick: remember,
  };
  return (
    <div className="ed-textbox">
      {tokens && tokens.length > 0 && (
        <div className="ed-chips" role="group" aria-label="Автоматаар бөглөгдөх үг нэмэх">
          {tokens.map((t) => (
            <button
              type="button" key={t.token} className="ed-chip" title={`${t.token} — үзүүлэхэд жинхэнэ утгаараа солигдоно`}
              disabled={!!max && value.length + t.token.length > max}
              onMouseDown={(e) => e.preventDefault() /* keep the caret in the text box */}
              onClick={() => insert(t.token)}
            >
              + {t.label}
            </button>
          ))}
        </div>
      )}
      {grow ? (
        <textarea
          {...common} rows={oneLine ? 1 : rows} className="ed-input ed-grow"
          onChange={(e) => { change(e.target.value); remember(); }}
          onKeyDown={oneLine ? (e) => { if (e.key === 'Enter') e.preventDefault(); } : undefined}
        />
      ) : (
        <input {...common} onChange={(e) => { change(e.target.value); remember(); }} />
      )}
    </div>
  );
}

/** The «any colour» picker as one more swatch in the row, filled with the custom colour once chosen. */
function CustomColor({ value, presets, onChange }: { value: string; presets: string[]; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : '';
  const custom = !!hex && !presets.some((c) => c.toLowerCase() === hex.toLowerCase());
  return (
    <label className={`ed-color-custom ${custom ? 'on' : ''}`} title="Өөр өнгө сонгох" style={custom ? { background: hex } : undefined}>
      <input type="color" aria-label="Өөр өнгө сонгох" value={hex || '#ffffff'} onChange={(e) => onChange(e.target.value)} />
      {!custom && <span aria-hidden>+</span>}
    </label>
  );
}

export function useUpload(upload: Uploader) {
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState('');
  const run = async (files: File[], kind: 'image' | 'audio', maxMB?: number) => {
    setErr(''); setBusy((b) => b + files.length);
    const out: string[] = [];
    for (const file of files) {
      try { out.push(await upload(file, kind, maxMB)); }
      catch (e) { setErr((e as Error).message); }
      finally { setBusy((b) => b - 1); }
    }
    return out;
  };
  return { busy, err, run };
}

export function ImageSlot({ url, onChange, upload }: { url: string; onChange: (u: string) => void; upload: Uploader }) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, err, run } = useUpload(upload);
  const pick = async (files: FileList | null) => { if (!files?.length) return; const [u] = await run([files[0]], 'image'); if (u) onChange(u); };
  return (
    <>
      <div className="ed-images single">
        {url ? (
          <div className="ed-thumb">
            <img src={url} alt="" />
            <div className="ed-thumb-actions">
              <button type="button" onClick={() => input.current?.click()}>Солих</button>
              <button type="button" onClick={() => onChange('')}>Устгах</button>
            </div>
          </div>
        ) : (
          <button type="button" className="ed-add" onClick={() => input.current?.click()} disabled={busy > 0}>
            {busy ? <span className="ed-spin" /> : <><b>＋</b><span>Зураг нэмэх</span></>}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
      {err && <p className="ed-help err">{err}</p>}
    </>
  );
}

function ImageGrid({ fkey, urls, max, onChange, upload }: { fkey: string; urls: string[]; max: number; onChange: (u: string[]) => void; upload: Uploader }) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, err, run } = useUpload(upload);
  const latest = useRef(urls); latest.current = urls;
  // Some templates (Book) index this array by fixed slot and keep '' for empty ones —
  // then empty slots show as numbered «＋» tiles and removing a photo leaves its slot empty.
  const slotted = urls.some((u) => !u);
  const holes = urls.map((u, i) => (u ? -1 : i)).filter((i) => i >= 0);
  const room = max - urls.length + holes.length;
  const target = useRef<number | null>(null);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const slot = target.current; target.current = null;
    const got = await run([...files].slice(0, slot != null ? 1 : room), 'image');
    if (!got.length) return;
    const next = [...latest.current];
    if (slot != null) { next[slot] = got[0]; onChange(next); return; }
    for (const u of got) { const h = next.indexOf(''); if (h >= 0) next[h] = u; else next.push(u); }
    onChange(next.slice(0, max));
  };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= urls.length) return;
    const next = [...urls]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <>
      <div className="ed-images">
        {urls.map((u, i) => !u ? (
          <button type="button" className="ed-add slot" key={'e' + i} data-edit-field={`${fkey}.${i}`} onClick={() => { target.current = i; input.current?.click(); }} aria-label={`${i + 1}-р байрлалд зураг нэмэх`}>
            <b>＋</b><span>{i + 1}</span>
          </button>
        ) : (
          <div className="ed-thumb" key={u + i} data-edit-field={`${fkey}.${i}`}>
            <img src={u} alt="" />
            <span className="ed-num">{i + 1}</span>
            <div className="ed-thumb-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Зүүн тийш">←</button>
              <button type="button" onClick={() => onChange(slotted ? urls.map((x, k) => (k === i ? '' : x)) : urls.filter((_, k) => k !== i))} aria-label="Устгах">✕</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} aria-label="Баруун тийш">→</button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => <div className="ed-thumb loading" key={'b' + i}><span className="ed-spin" /></div>)}
        {urls.length + busy < max && !slotted && (
          <button type="button" className="ed-add" onClick={() => input.current?.click()}><b>＋</b><span>Нэмэх</span></button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {err && <p className="ed-help err">{err}</p>}
    </>
  );
}

/** Pick the gift's music from our library — nothing is uploaded. ▶ previews a track. */
function MusicPicker({ url, onChange, only }: { url: string; onChange: (u: string) => void; only?: string[] }) {
  const tracks = only ? MUSIC.filter((t) => only.includes(t.id)) : MUSIC;
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => { audio.current?.pause(); }, []);
  const preview = (t: Track) => {
    if (playing === t.id) { audio.current?.pause(); setPlaying(null); return; }
    audio.current?.pause();
    audio.current = Object.assign(new Audio(musicUrl(t)), { volume: 0.7 });
    audio.current.onended = () => setPlaying(null);
    audio.current.play().catch(() => setPlaying(null));
    setPlaying(t.id);
  };
  if (!tracks.length) return <p className="ed-help">Хөгжмийн сан удахгүй нэмэгдэнэ.</p>;
  return (
    <div className="ed-music" role="radiogroup">
      <button type="button" role="radio" aria-checked={!url} className={`ed-track ${!url ? 'on' : ''}`} onClick={() => onChange('')}>
        <span className="ed-track-name">Хөгжимгүй</span>
      </button>
      {tracks.map((t) => (
        <div key={t.id} className={`ed-track ${url === musicUrl(t) ? 'on' : ''}`}>
          <button type="button" className="ed-track-play" onClick={() => preview(t)} aria-label={`${t.title} — ${playing === t.id ? 'зогсоох' : 'сонсох'}`}>{playing === t.id ? '■' : '▶'}</button>
          <button type="button" role="radio" aria-checked={url === musicUrl(t)} className="ed-track-name" onClick={() => onChange(musicUrl(t))}>
            {t.title}<small>{t.mood}</small>
          </button>
        </div>
      ))}
    </div>
  );
}

/** One-tap emoji palette: tap to pick, tap the picked one again to clear. */
export function EmojiPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="ed-emojis" role="radiogroup">
      {options.map((e) => (
        <button key={e} type="button" role="radio" aria-checked={value === e} aria-label={e} className={value === e ? 'on' : ''} onClick={() => onChange(value === e ? '' : e)}>{e}</button>
      ))}
    </div>
  );
}
