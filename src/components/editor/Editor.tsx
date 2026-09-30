'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './editor.css';
import type { Content, ContentValue, Field, Section, TemplateMeta } from '@/templates/types';
import { FieldControl, asArr } from './Fields';
import { Cards } from './Cards';
import { uploadMedia } from '@/lib/upload';
import { PreviewFrame, type Device } from './PreviewFrame';
import { Quick } from './Quick';
import { QUICK } from '@/templates/quickRegistry';

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

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
const cleanSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40);

/** A `required` field counts as filled when every slot/item has something in it. */
const filled = (f: Field, v: ContentValue | undefined) =>
  f.type === 'images' ? Array.from({ length: f.max }, (_, i) => asArr(v)[i]).every(Boolean)
  : f.type === 'list' ? Array.from({ length: f.count }, (_, i) => asArr(v)[i]?.trim()).every(Boolean)
  : typeof v === 'string' ? v.trim() !== '' : v != null;
const missing = (s: Section, c: Content) => s.fields.some((f) => f.required && !filled(f, c[f.key]));

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
  // the preview scene of whatever field/card has focus; falls back to the step's own scene
  const [focusPin, setFocusPin] = useState<string | number | null>(null);
  useEffect(() => { setFocusPin(null); }, [open]);
  const [device, setDevice] = useState<Device>('desktop');
  // Quick create (names → photos → tone → publish) is the default for a gift that isn't
  // published yet; «Дэлгэрэнгүй засах» opens the full step editor. ?mode=advanced forces it.
  const quick = QUICK[meta.id];
  const [mode, setMode] = useState<'quick' | 'advanced'>(quick && initialStatus !== 'published' ? 'quick' : 'advanced');
  useEffect(() => { if (new URLSearchParams(location.search).get('mode') === 'advanced') setMode('advanced'); }, []);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [share, setShare] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { if (window.innerWidth < 900) setDevice('mobile'); }, []);

  /* ── live preview ── */
  const latest = useRef(content); latest.current = content;
  const [previewingFull, setPreviewingFull] = useState(false);
  const openIndex = meta.schema.findIndex((s) => s.id === open);
  const currentSection = meta.schema[openIndex] ?? meta.schema[0];
  const prevSection = openIndex > 0 ? meta.schema[openIndex - 1] : undefined;
  const nextSection = openIndex >= 0 && openIndex < meta.schema.length - 1 ? meta.schema[openIndex + 1] : undefined;
  const pin = previewingFull ? null : (focusPin ?? currentSection?.previewPage ?? null);
  const debounce = meta.previewDebounceMs ?? 700;

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
  const patch = (p: Content) => setContent((c) => ({ ...c, ...p }));
  const tracksRequired = meta.schema.some((s) => s.fields.some((f) => f.required));
  const upload = useCallback((file: File, kind: 'image' | 'audio', maxMB?: number) => uploadMedia(file, userId, pageId, kind, maxMB), [userId, pageId]);

  /* ── click a photo tile in the live preview (currently only Book does this) to
     replace that exact slot, instead of the buyer only being able to add photos to
     a pool and hope they land on the right page ── */
  const pickPhotoInput = useRef<HTMLInputElement>(null);
  const pickSlot = useRef<number | null>(null);
  useEffect(() => {
    const onPick = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'dear:pick-photo') return;
      pickSlot.current = e.data.slot;
      pickPhotoInput.current?.click();
    };
    window.addEventListener('message', onPick);
    return () => window.removeEventListener('message', onPick);
  }, []);
  const onPickPhotoFile = async (file: File | undefined) => {
    const slot = pickSlot.current;
    if (!file || slot == null) return;
    const url = await upload(file, 'image').catch(() => null);
    if (!url) return;
    // 'photos' is Book's own images-field key — this message only ever comes from Book's preview.
    setContent((c) => {
      const arr = Array.isArray(c.photos) ? [...(c.photos as string[])] : [];
      while (arr.length <= slot) arr.push('');
      arr[slot] = url;
      return { ...c, photos: arr };
    });
  };

  const callPublish = async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/pages/${pageId}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  };
  const [publishErr, setPublishErr] = useState('');
  const publish = async () => {
    setPublishing(true); setPublishErr('');
    if (save !== 'saved') await persist();
    const { ok, j } = await callPublish({ publish: true }).catch(() => ({ ok: false, j: {} as Record<string, string> }));
    setPublishing(false);
    if (ok) { setStatus('published'); setSlug(j.slug); setSlugDraft(j.slug); setUrl(j.url); setShare(true); }
    else setPublishErr(j.error || 'Нийтэлж чадсангүй. Интернэтээ шалгаад дахин дарна уу.');
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

  const saveLabel = { saved: 'Бүгд хадгалагдсан', dirty: 'Хадгалаагүй өөрчлөлт…', saving: 'Хадгалж байна…', error: 'Хадгалж чадсангүй — дараагийн засвараар дахин оролдоно' }[save];

  const shareModal = share && slug && (
    <ShareModal
      url={url} slug={slug} slugDraft={slugDraft} setSlugDraft={setSlugDraft} saveSlug={saveSlug} slugErr={slugErr}
      linkBase={linkBase} subdomain={subdomain} copied={copied} copy={copy} shareToFacebook={shareToFacebook}
      unpublish={unpublish} close={() => setShare(false)}
    />
  );

  if (mode === 'quick' && quick) {
    return (
      <>
        <Quick
          meta={meta} spec={quick} content={content} onPatch={patch} upload={upload}
          saveLabel={saveLabel} save={save} status={status} publishing={publishing} publishErr={publishErr}
          onPublish={publish} onShare={() => setShare(true)} onAdvanced={() => setMode('advanced')}
        />
        {shareModal}
      </>
    );
  }

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
          {quick && (
            <button className="btn btn-sm btn-ghost ed-quick-back" onClick={() => setMode('quick')} title="Нэр, зураг, өнгө аясаа 4 алхмаар">⚡ Хялбар</button>
          )}
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
        <nav className="ed-steps" aria-label="Хэсгүүд">
          {meta.schema.map((s, i) => {
            // Page-based templates (Book: numeric previewPage) label each step with the page
            // number the preview's counter shows for it; sections that aren't tied to one
            // page (Book's bulk photo upload) get an icon. Scene-based templates keep 1..n.
            const pageNo = typeof s.previewPage === 'number' ? s.previewPage + 1 : null;
            const paged = meta.schema.some((x) => typeof x.previewPage === 'number');
            const label = s.short ?? (paged ? (pageNo ?? '▦') : i + 1);
            // ⚠ = something required is still empty; ✓ = nothing required is missing
            const state = !tracksRequired ? null : missing(s, content) ? 'todo' : 'done';
            const stateLabel = state === 'todo' ? ' · дутуу' : state === 'done' ? ' · бэлэн' : '';
            return (
              <button
                key={s.id}
                type="button"
                className={`ed-step ${s.short ? 'wide' : ''} ${open === s.id ? 'on' : ''} ${state ?? ''}`}
                aria-current={open === s.id ? 'step' : undefined}
                aria-label={(pageNo ? `${pageNo}-р хуудас · ${s.title}` : s.title) + stateLabel}
                title={(pageNo ? `${pageNo}-р хуудас · ${s.title}` : s.title) + stateLabel}
                onClick={() => setOpen(s.id)}
              >
                {label}
                {state && <i aria-hidden>{state === 'todo' ? '⚠' : '✓'}</i>}
              </button>
            );
          })}
        </nav>
        {currentSection && (
          <section className="ed-sec open">
            <h2 className="ed-sec-title">{currentSection.title}</h2>
            <div className="ed-sec-body">
              {currentSection.description && <p className="ed-help" style={{ marginTop: 0 }}>{currentSection.description}</p>}
              {(() => {
                const cards = currentSection.cards;
                const inCards = (k: string) => !!cards && (k === cards.image || k === cards.title || k === cards.text);
                const maxOf = (k: string) => { const f = currentSection.fields.find((x) => x.key === k); return f && 'max' in f ? f.max : undefined; };
                const tokensFor = (k: string) => (currentSection.fields.find((x) => x.key === k)?.tokens ? meta.tokens : undefined);
                return (
                  <>
                    {cards && (
                      <Cards
                        key={currentSection.id} cfg={cards} content={content} onPatch={patch} upload={upload}
                        tokens={tokensFor(cards.text)} titleMax={maxOf(cards.title)} textMax={maxOf(cards.text)}
                        onFocusCard={(i) => cards.previewPrefix && setFocusPin(`${cards.previewPrefix}${i}`)}
                      />
                    )}
                    {currentSection.fields.filter((f) => !inCards(f.key)).map((f) => (
                      <FieldControl
                        key={f.key} field={f} value={content[f.key]} onChange={(v) => set(f.key, v)} upload={upload}
                        tokens={f.tokens ? meta.tokens : undefined}
                        onFocus={f.previewPage != null ? () => setFocusPin(f.previewPage!) : undefined}
                      />
                    ))}
                  </>
                );
              })()}
              <div className="ed-step-nav">
                {prevSection
                  ? <button className="btn btn-sm" onClick={() => setOpen(prevSection.id)}>← Өмнөх</button>
                  : <span />}
                {nextSection && (
                  <button className="btn btn-sm btn-primary" onClick={() => setOpen(nextSection.id)} title={nextSection.title}>
                    Дараах →
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
        <p className="ed-help" style={{ padding: '6px 4px 30px' }}>
          Өөрчлөлт автоматаар хадгалагдана. {status === 'published' ? 'Таны линк шууд шинэчлэгдэнэ.' : 'Бэлэн болмогц «Нийтлэх» дарна уу.'}
        </p>
      </aside>

      <section className="ed-stage">
        <PreviewFrame
          key={previewingFull ? 'full' : 'pinned'} className="ed-stage-frame"
          templateId={meta.id} content={content} pin={pin} device={device} debounceMs={debounce}
        />
        <input
          ref={pickPhotoInput} type="file" accept="image/*" hidden
          onChange={(e) => { void onPickPhotoFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </section>

      {shareModal}
    </div>
  );
}

type ShareProps = {
  url: string; slug: string; slugDraft: string; setSlugDraft: (v: string) => void; saveSlug: () => void; slugErr: string;
  linkBase: string; subdomain: boolean; copied: boolean; copy: () => void; shareToFacebook: () => void;
  unpublish: () => void; close: () => void;
};

function ShareModal({ url, slug, slugDraft, setSlugDraft, saveSlug, slugErr, linkBase, subdomain, copied, copy, shareToFacebook, unpublish, close }: ShareProps) {
  return (
    <div className="ed-modal" onClick={(e) => e.target === e.currentTarget && close()}>
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
  );
}
