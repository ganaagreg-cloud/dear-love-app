'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ContentValue, Field, TemplateMeta } from '@/templates/types';
import { spotifyId } from '@/templates/sanitize';

export type Uploader = (file: File, kind: 'image' | 'audio', maxMB?: number) => Promise<string>;

export type Tokens = NonNullable<TemplateMeta['tokens']>;

type Props = {
  field: Field; value: ContentValue | undefined; onChange: (v: ContentValue) => void; upload: Uploader;
  /** Insert chips for this field's text boxes (only passed when the field opts in). */
  tokens?: Tokens;
  onFocus?: () => void;
};

export const asStr = (v: unknown) => (typeof v === 'string' ? v : '');
export const asArr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

/** Anything a buyer might write more than a line of gets a growing box, never a one-line input. */
const LONG = 40;

export function FieldControl({ field: f, value, onChange, upload, tokens, onFocus }: Props) {
  return (
    <div className="ed-field" onFocusCapture={onFocus}>
      {f.type !== 'toggle' && (
        <label className="ed-label">
          <span>{f.label}</span>
          {(f.type === 'text' || f.type === 'textarea') && f.max && (
            <small className={asStr(value).length > f.max * 0.9 ? 'warn' : ''}>{asStr(value).length}/{f.max}</small>
          )}
          {f.type === 'images' && <small>{asArr(value).length}/{f.max}</small>}
        </label>
      )}
      <Control field={f} value={value} onChange={onChange} upload={upload} tokens={tokens} />
      {f.help && <p className="ed-help">{f.help}</p>}
    </div>
  );
}

function Control({ field: f, value, onChange, upload, tokens }: Props) {
  switch (f.type) {
    case 'text':
      return <TextBox value={asStr(value)} max={f.max} placeholder={f.placeholder} tokens={tokens} onChange={onChange} />;
    case 'textarea':
      return <TextBox multiline value={asStr(value)} max={f.max} rows={f.rows} placeholder={f.placeholder} tokens={tokens} onChange={onChange} />;
    case 'date':
      return <DateInput value={asStr(value)} onChange={onChange} />;
    case 'select':
      return (
        <div className="ed-seg">
          {f.options.map((o) => (
            <button type="button" key={o.value} aria-pressed={asStr(value) === o.value} className={asStr(value) === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
          ))}
        </div>
      );
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
            <TextBox key={i} multiline={(f.max ?? 200) > LONG} value={v} max={f.max} rows={2} placeholder={`${f.itemLabel ?? 'Мөр'} ${i + 1}`} tokens={tokens}
              onChange={(t) => { const next = [...arr]; next[i] = t; onChange(next); }} />
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
      return <ImageGrid urls={asArr(value)} max={f.max} onChange={(u) => onChange(u)} upload={upload} />;
    case 'audio':
      return <AudioSlot url={asStr(value)} maxMB={f.maxMB ?? 10} onChange={(u) => onChange(u)} upload={upload} />;
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

/* ── dates: shown and typed as YYYY.MM.DD (how dates are written in Mongolian), stored as ISO ── */
const isoOk = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};
const dotted = (iso: string) => (iso ? iso.replace(/-/g, '.') : '');

export function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(dotted(value));
  const [bad, setBad] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  // follow outside changes (calendar pick, clear) without fighting a half-typed date
  useEffect(() => { setText((t) => (t.replace(/\./g, '-') === value ? t : dotted(value))); setBad(false); }, [value]);

  const type = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    setText([d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('.'));
    setBad(false);
    if (!d) onChange('');
    else if (d.length === 8) {
      const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
      if (isoOk(iso)) onChange(iso); else setBad(true);
    }
  };
  const openPicker = () => {
    const el = picker.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); el.click(); }
  };
  return (
    <>
      <div className="ed-date">
        <input
          className="ed-input" inputMode="numeric" placeholder="ЖЖЖЖ.СС.ӨӨ" value={text} aria-invalid={bad || undefined}
          onChange={(e) => type(e.target.value)} onBlur={() => setBad(!!text && text.length < 10 ? true : bad)}
        />
        <button type="button" className="ed-date-btn" onClick={openPicker} aria-label="Хуанлиас сонгох" title="Хуанлиас сонгох">📅</button>
        {value && <button type="button" className="ed-date-btn" onClick={() => { setText(''); onChange(''); }} aria-label="Арилгах" title="Арилгах">✕</button>}
        <input ref={picker} type="date" className="ed-date-native" tabIndex={-1} aria-hidden value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      {bad && <p className="ed-help err">Огноог ЖЖЖЖ.СС.ӨӨ хэлбэрээр бичнэ үү. Жишээ нь: 2024.01.10</p>}
    </>
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

function ImageSlot({ url, onChange, upload }: { url: string; onChange: (u: string) => void; upload: Uploader }) {
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

function ImageGrid({ urls, max, onChange, upload }: { urls: string[]; max: number; onChange: (u: string[]) => void; upload: Uploader }) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, err, run } = useUpload(upload);
  const latest = useRef(urls); latest.current = urls;
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - urls.length;
    const got = await run([...files].slice(0, room), 'image');
    if (got.length) onChange([...latest.current, ...got].slice(0, max));
  };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= urls.length) return;
    const next = [...urls]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <>
      <div className="ed-images">
        {urls.map((u, i) => (
          <div className="ed-thumb" key={u + i}>
            <img src={u} alt="" />
            <span className="ed-num">{i + 1}</span>
            <div className="ed-thumb-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Зүүн тийш">←</button>
              <button type="button" onClick={() => onChange(urls.filter((_, k) => k !== i))} aria-label="Устгах">✕</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} aria-label="Баруун тийш">→</button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => <div className="ed-thumb loading" key={'b' + i}><span className="ed-spin" /></div>)}
        {urls.length + busy < max && (
          <button type="button" className="ed-add" onClick={() => input.current?.click()}><b>＋</b><span>Нэмэх</span></button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {err && <p className="ed-help err">{err}</p>}
    </>
  );
}

function AudioSlot({ url, maxMB, onChange, upload }: { url: string; maxMB: number; onChange: (u: string) => void; upload: Uploader }) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, err, run } = useUpload(upload);
  const pick = async (files: FileList | null) => { if (!files?.length) return; const [u] = await run([files[0]], 'audio', maxMB); if (u) onChange(u); };
  return (
    <>
      {url ? (
        <div className="ed-audio">
          <audio src={url} controls preload="none" />
          <div className="row">
            <button type="button" className="btn btn-sm" onClick={() => input.current?.click()}>Солих</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>Устгах</button>
          </div>
        </div>
      ) : (
        <button type="button" className="ed-add wide" onClick={() => input.current?.click()} disabled={busy > 0}>
          {busy ? <span className="ed-spin" /> : <><b>♫</b><span>Дуу оруулах (mp3 · {maxMB} MB хүртэл)</span></>}
        </button>
      )}
      <input ref={input} type="file" accept="audio/*" hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
      {err && <p className="ed-help err">{err}</p>}
    </>
  );
}
