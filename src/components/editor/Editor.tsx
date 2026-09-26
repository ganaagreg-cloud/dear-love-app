'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './editor.css';
import type { Content, ContentValue, TemplateMeta } from '@/templates/types';
import { FieldControl } from './Fields';
import { uploadMedia } from '@/lib/upload';

type Props = {
  meta: TemplateMeta;
  pageId: string;
  userId: string;
  initialContent: Content;
  initialStatus: 'paid' | 'published';
  initialSlug: string | null;
  initialUrl: string;
  /** ".dearlove.mn" (subdomain mode) or "dearlove.mn/p/" */
  linkBase: string;
  subdomain: boolean;
};

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
const DEVICES = { desktop: { w: 1366, h: 820 }, mobile: { w: 390, h: 844 } } as const;
const cleanSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40);

export default function Editor({ meta, pageId, userId, initialContent, initialStatus, initialSlug, initialUrl, linkBase, subdomain }: Props) {
  const [content, setContent] = useState<Content>(initialContent);
  const [save, setSave] = useState<SaveState>('saved');
  const [status, setStatus] = useState(initialStatus);
  const [slug, setSlug] = useState(initialSlug);
  const [url, setUrl] = useState(initialUrl);
  const [slugDraft, setSlugDraft] = useState(initialSlug ?? '');
  const [slugErr, setSlugErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<string>(meta.schema[0]?.id ?? '');
  const [device, setDevice] = useState<keyof typeof DEVICES>('desktop');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [share, setShare] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { if (window.innerWidth < 900) setDevice('mobile'); }, []);

  /* ── live preview (iframe + postMessage) ── */
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(content); latest.current = content;
  const [previewingFull, setPreviewingFull] = useState(false);
  const pin = previewingFull ? null : (meta.schema.find((s) => s.id === open)?.previewPage ?? null);
  const openIndex = meta.schema.findIndex((s) => s.id === open);
  const nextSection = openIndex >= 0 ? meta.schema[openIndex + 1] : undefined;
  const post = useCallback(
    () => frame.current?.contentWindow?.postMessage({ type: 'dear:content', content: latest.current, pin }, window.location.origin),
    [pin],
  );
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === 'dear:ready') post(); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [post]);
  useEffect(() => { const t = setTimeout(post, 700); return () => clearTimeout(t); }, [content, post]);

  /* ── autosave ── */
  const persist = useCallback(async () => {
    setSave('saving');
    const r = await fetch(`/api/pages/${pageId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: latest.current }) }).catch(() => null);
    setSave(r?.ok ? 'saved' : 'error');
  }, [pageId]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSave('dirty');
    const t = setTimeout(() => { void persist(); }, 1200);
    return () => clearTimeout(t);
  }, [content, persist]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (save === 'dirty' || save === 'saving') e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);

  const set = (key: string, v: ContentValue) => setContent((c) => ({ ...c, [key]: v }));
  const upload = useCallback((file: File, kind: 'image' | 'audio', maxMB?: number) => uploadMedia(file, userId, pageId, kind, maxMB), [userId, pageId]);

  const callPublish = async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/pages/${pageId}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  };
  const publish = async () => {
    setPublishing(true);
    if (save !== 'saved') await persist();
    const { ok, j } = await callPublish({ publish: true });
    setPublishing(false);
    if (ok) { setStatus('published'); setSlug(j.slug); setSlugDraft(j.slug); setUrl(j.url); setShare(true); }
  };
  const saveSlug = async () => {
    setSlugErr('');
    const want = cleanSlug(slugDraft).replace(/^-|-$/g, '');
    if (!want || want === slug) return;
    const { ok, j } = await callPublish({ publish: true, slug: want });
    if (!ok) { setSlugErr(j.error || 'Алдаа гарлаа'); return; }
    setSlug(j.slug); setSlugDraft(j.slug); setUrl(j.url); setStatus('published');
  };
  const unpublish = async () => {
    const { ok } = await callPublish({ publish: false });
    if (ok) { setStatus('paid'); setShare(false); }
  };
  const copy = async () => { await navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const shareToFacebook = () => {
    const w = window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=580,height=650,noopener,noreferrer');
    w?.focus();
  };

  /* ── scale the preview device to fit ── */
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const fit = () => {
      const d = DEVICES[device], pad = 36;
      setScale(Math.min((el.clientWidth - pad) / d.w, (el.clientHeight - pad) / d.h, 1));
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [device, tab]);

  const d = DEVICES[device];
  const saveLabel = { saved: 'Бүгд хадгалагдсан', dirty: 'Хадгалаагүй өөрчлөлт…', saving: 'Хадгалж байна…', error: 'Хадгалж чадсангүй — дараагийн засвараар дахин оролдоно' }[save];

  return (
    <div className="ed" data-tab={tab}>
      <header className="ed-top">
        <div className="row" style={{ minWidth: 0 }}>
          <Link href="/dashboard" className="ed-back" aria-label="Миний хуудсууд руу буцах">←</Link>
          <div style={{ minWidth: 0 }}>
            <div className="ed-title">{meta.name}</div>
            <div className={`ed-save ${save}`}>{saveLabel}</div>
          </div>
        </div>
        <div className="ed-tabs">
          <button className={tab === 'edit' ? 'on' : ''} onClick={() => setTab('edit')}>Засах</button>
          <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Харах</button>
        </div>
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
      </header>

      <aside className="ed-side">
        <div className="ed-lock">🔒 Энэ хуудсыг зөвхөн та засах эрхтэй</div>
        {meta.schema.map((s) => (
          <section key={s.id} className={`ed-sec ${open === s.id ? 'open' : ''}`}>
            <button className="ed-sec-head" aria-expanded={open === s.id} aria-controls={`ed-sec-body-${s.id}`} onClick={() => setOpen(open === s.id ? '' : s.id)}>
              <span>{s.title}</span><i>{open === s.id ? '−' : '+'}</i>
            </button>
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
          </section>
        ))}
        <p className="ed-help" style={{ padding: '6px 4px 30px' }}>
          Өөрчлөлт автоматаар хадгалагдана. {status === 'published' ? 'Таны линк шууд шинэчлэгдэнэ.' : 'Бэлэн болмогц «Нийтлэх» дарна уу.'}
        </p>
      </aside>

      <section className="ed-stage" ref={stage}>
        <div className="ed-device" data-device={device} style={{ width: d.w * scale, height: d.h * scale }}>
          <iframe ref={frame} title="Шууд харагдац" src={`/render/${meta.id}`} onLoad={post} allow="autoplay; encrypted-media"
            style={{ width: d.w, height: d.h, transform: `scale(${scale})` }} />
        </div>
      </section>

      {share && slug && (
        <div className="ed-modal" onClick={(e) => e.target === e.currentTarget && setShare(false)}>
          <div className="ed-modal-card">
            <div style={{ fontSize: 40 }}>💌</div>
            <h2>Таны хуудас бэлэн боллоо</h2>
            <p className="muted small">Энэ линкийг түүнд илгээгээрэй. Дараа хийсэн засвар тань шууд харагдана.</p>

            <label className="ed-label" style={{ marginTop: 14 }}><span>Линкийн нэр</span></label>
            <div className="slug-row">
              {!subdomain && <span>{linkBase}</span>}
              <input value={slugDraft} onChange={(e) => setSlugDraft(cleanSlug(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && saveSlug()} placeholder="anu-bat" aria-label="Линкийн нэр" />
              {subdomain && <span>{linkBase}</span>}
              {slugDraft !== slug && <button className="btn btn-sm btn-primary" style={{ margin: 4 }} onClick={saveSlug}>Хадгалах</button>}
            </div>
            <p className={`ed-help ${slugErr ? 'err' : ''}`}>{slugErr || 'Латин жижиг үсэг, тоо, зураас. Жишээ нь: anu-bat, 1000-honog'}</p>

            <div className="ed-link"><input readOnly value={url} onFocus={(e) => e.target.select()} /></div>
            <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={copy}>{copied ? 'Хуулсан ✓' : 'Линк хуулах'}</button>
              <button className="btn btn-fb" onClick={shareToFacebook}>Facebook</button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button className="btn" onClick={() => navigator.share({ title: 'Танд зориулав ♡', url }).catch(() => {})}>Instagram, TikTok, Messenger…</button>
              )}
              <a className="btn" href={url} target="_blank" rel="noreferrer">Нээх</a>
            </div>
            {!(typeof navigator !== 'undefined' && 'share' in navigator) && (
              <p className="ed-help">Instagram, TikTok зэрэг апп руу шууд хуваалцах товч утасны мобайл хөтчид гардаг. Компьютер дээрээс бол линкийг хуулаад тухайн апп-даа буулгаарай.</p>
            )}
            <button className="btn btn-ghost btn-sm" onClick={unpublish} style={{ marginTop: 8 }}>Нийтлэлээс буцаах</button>
          </div>
        </div>
      )}
    </div>
  );
}
