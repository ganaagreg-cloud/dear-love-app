'use client';
import { useRef, useState } from 'react';
import type { ContentValue, Field } from '@/templates/types';
import { spotifyId } from '@/templates/sanitize';

export type Uploader = (file: File, kind: 'image' | 'audio', maxMB?: number) => Promise<string>;

type Props = { field: Field; value: ContentValue | undefined; onChange: (v: ContentValue) => void; upload: Uploader };

const asStr = (v: unknown) => (typeof v === 'string' ? v : '');
const asArr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

export function FieldControl({ field: f, value, onChange, upload }: Props) {
  return (
    <div className="ed-field">
      {f.type !== 'toggle' && (
        <label className="ed-label">
          <span>{f.label}</span>
          {(f.type === 'text' || f.type === 'textarea') && f.max && (
            <small className={asStr(value).length > f.max * 0.9 ? 'warn' : ''}>{asStr(value).length}/{f.max}</small>
          )}
          {f.type === 'images' && <small>{asArr(value).length}/{f.max}</small>}
        </label>
      )}
      <Control field={f} value={value} onChange={onChange} upload={upload} />
      {f.help && <p className="ed-help">{f.help}</p>}
    </div>
  );
}

function Control({ field: f, value, onChange, upload }: Props) {
  switch (f.type) {
    case 'text':
      return <input className="ed-input" value={asStr(value)} maxLength={f.max} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return <textarea className="ed-input" value={asStr(value)} maxLength={f.max} rows={f.rows ?? 3} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'date':
      return <input className="ed-input" type="date" value={asStr(value)} onChange={(e) => onChange(e.target.value)} />;
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
          <label className="ed-color-custom" title="Өөр өнгө сонгох">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(asStr(value)) ? asStr(value) : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
            <span>Өөр өнгө</span>
          </label>
        </div>
      );
    case 'list': {
      const arr = Array.from({ length: f.count }, (_, i) => asArr(value)[i] ?? '');
      return (
        <div className="ed-list">
          {arr.map((v, i) => (
            <input key={i} className="ed-input" value={v} maxLength={f.max} placeholder={`${f.itemLabel ?? 'Мөр'} ${i + 1}`}
              onChange={(e) => { const next = [...arr]; next[i] = e.target.value; onChange(next); }} />
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

function useUpload(upload: Uploader) {
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
